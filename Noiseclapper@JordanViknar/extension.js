//----------------------------Variables------------------------------
let POSITION;
let POSITION_NUMBER;
var LOGGING;
let NoiseclapperBluetoothClient = null

const SupportedDeviceNames = [
	"Soundcore Life Q35",		//Not tested
	"Soundcore Life Q30",
	"Soundcore Life Q20+",		//Not tested
	"Soundcore Life Q20",		//Not tested
	"Soundcore Life Q10",		//Not tested, only partially compatible
	"BES_BLE"					//Buggy name sometimes applied to the Q30
]

//------------------------------Libraries----------------------------
// GI Libraries
import St from 'gi://St'
import GObject from 'gi://GObject'
import GnomeBluetooth from 'gi://GnomeBluetooth'

// Native GNOME Shell Modules
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import {Extension, gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

//--------------------- Enable and Disable functions ---------------------
let noiseclapperindicator;
export default class Noiseclapper extends Extension {
	constructor(metadata) {
		super(metadata);
	}
	init() {
		String.prototype.format = Format.format;
	}
    enable() {
		logIfEnabled("info","Enabling Noiseclapper...");
	
		//We enable the bluetooth client
		logIfEnabled("debug","Enabling Bluetooth client...");
		NoiseclapperBluetoothClient = new GnomeBluetooth.Client();
	
		//Creates the indicator
		logIfEnabled("debug","Creating and adding Noiseclapper indicator...");
		noiseclapperindicator = new NoiseclapperIndicator(this);
		//Adds it to the panel
		Main.panel.addToStatusArea('NoiseclapperIndicator', noiseclapperindicator);
		//Sets position
		noiseclapperindicator.applyNewPosition()
	}
	disable() {
		logIfEnabled("info","Disabling Noiseclapper...");

		//Disable Bluetooth client if enabled
		if (NoiseclapperBluetoothClient != null) {
			NoiseclapperBluetoothClient = null;
		}

		//Removes the indicator
		logIfEnabled("debug","Removing Noiseclapper indicator...");
		noiseclapperindicator.destroy();
		noiseclapperindicator = null;
	}
}

//------------------------Util Functions------------------------
function logIfEnabled(type,message) {
	if (LOGGING == true) {
		switch(type) {
			default:
				console.log("[Noiseclapper] "+message);
				break;
			case "info":
				console.info("[Noiseclapper] "+message);
				break;
			case "warn":
				console.warn("[Noiseclapper] "+message);
				break;
			case "error":
				console.error("[Noiseclapper] "+message);
				break;
			case "debug":
				console.debug("[Noiseclapper] "+message);
				break;
		}
	}
}

//------------------------Bluetooth Functions------------------------
function gatherBluetoothDevices() {
	try{
		logIfEnabled("info","Obtaining connected devices...");
		return NoiseclapperBluetoothClient.get_devices();
	} catch (error) {
		logIfEnabled("error","Could not get Bluetooth devices : " + error);
		Main.notifyError(_('Noiseclapper - Error'),error.message);
		return "failed";
	}
}

function devicesObjectToArray(object){
	const numberOfDevices = object.get_n_items()

	let devices = []
	for (let i = 0; i < numberOfDevices; i++) {
		devices.push(object.get_item(i))
	}

	return devices
}

function sendSignal(signal, address) {
	const command = "python3 -c \"import socket;\
	s = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM);\
	s.connect((\'"+address+"\', 12));\
	s.send(bytearray.fromhex(\'"+signal+"\'));\
	s.close();\"";

	Util.spawnCommandLine(command);
}

//------------------------Indicator Setup---------------------------
const NoiseclapperIndicator = GObject.registerClass({},
class NoiseclapperIndicator extends PanelMenu.Button {
	_init (ext) {
		logIfEnabled("debug","Initializing Noiseclapper indicator...");
		super._init(0);
		this._extension = ext

		//This will add a box object to the panel. It's basically the extension's button.
		const box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });

		//We create a GTK symbolic icon in the panel
		this.icon = new St.Icon({ icon_name: 'audio-headphones-symbolic',
			style_class: 'system-status-icon' });
		box.add_actor(this.icon);

		//The 2 submenus
		this.NoiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(_('Noise Cancelling Mode'));
		this.menu.addMenuItem(this.NoiseCancellingModeMenu);
		this.EqualizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(_('Equalizer Preset'));
		this.menu.addMenuItem(this.EqualizerPresetMenu);

		//The submenus' mode/preset lists
		const ANCSignalBase = "08ee00000006810e000"
		const NoiseCancellingModeList = [
			{ label: _('🚋 Transport'), signal: ANCSignalBase+"00001008c" },
			{ label: _('🏠 Indoor'), signal: ANCSignalBase+"00201008e" },
			{ label: _('🌳 Outdoor'), signal: ANCSignalBase+"00101008d" },
			//{ label: _('🔇 Default'), signal: ANCSignalBase+"00101008d" }, //Not really necessary, probably better to keep it as a comment.
			{ label: _('🚫 Normal / No ANC'), signal: ANCSignalBase+"20101008f" },
			{ label: _('🪟 Transparency / No NC'), signal: ANCSignalBase+"10101008e" },
		];
		this.addAllInListAsButtons(NoiseCancellingModeList, this.NoiseCancellingModeMenu);

		const equalizerSignalBase = "08ee00000002811400"
		const EqualizerPresetList = [
			{ label: _('🎵 Soundcore Signature'), signal: 	equalizerSignalBase+"000078787878787878784d" },
			{ label: _('🎸 Acoustic'), signal: 				equalizerSignalBase+"0100a0828c8ca0a0a08c34" },
			{ label: _('🎸 Bass Booster'), signal:			equalizerSignalBase+"0200a0968278787878789f" },
			{ label: _('🚫 Bass Reducer'), signal:			equalizerSignalBase+"0300505a6e787878787800" },
			{ label: _('🎻 Classical'), signal:				equalizerSignalBase+"040096966464788c96a0bf" },
			{ label: _('🎤 Podcast'), signal: 				equalizerSignalBase+"05005a8ca0a0968c7864b6" },
			{ label: _('🪩 Dance'), signal: 				equalizerSignalBase+"06008c5a6e828c8c825a5d" },
			{ label: _('🖴 Deep'), signal: 					 equalizerSignalBase+"07008c8296968c64504654" },
			{ label: _('⚡ Electronic'), signal:			   equalizerSignalBase+"0800968c648c828c9696e1" },
			{ label: _('🚫 Flat'), signal: 					equalizerSignalBase+"090064646e7878786464fc" },
			{ label: _('🎹 Hip-Hop'), signal: 				equalizerSignalBase+"0a008c966e6e8c6e8c96b1" },
			{ label: _('🎷 Jazz'), signal: 					equalizerSignalBase+"0b008c8c6464788c96a0b2" },
			{ label: _('💃🏽 Latin'), signal:				  equalizerSignalBase+"0c0078786464647896aa6d" },
			{ label: _('🍸 Lounge'), signal:				equalizerSignalBase+"0d006e8ca09678648c82b4" },
			{ label: _('🎹 Piano'), signal: 				equalizerSignalBase+"0e007896968ca0aa96a04b" },
			{ label: _('🎸 Pop'), signal: 					equalizerSignalBase+"0f006e829696826e645a66" },
			{ label: _('🎹 RnB'), signal:					equalizerSignalBase+"1000b48c64648c9696a0fd" },
			{ label: _('🎸 Rock'), signal:					equalizerSignalBase+"1100968c6e6e82969696e0" },
			{ label: _('🔉 Small Speaker(s)'), signal:		equalizerSignalBase+"1200a0968278645a50502d" },
			{ label: _('👄 Spoken Word'), signal:			equalizerSignalBase+"13005a64828c8c82785a4c" },
			{ label: _('🎼 Treble Booster'), signal: 		equalizerSignalBase+"14006464646e828c8ca075" },
			{ label: _('🚫 Treble Reducer'), signal:		equalizerSignalBase+"1500787878645a50503ca4" },
		]
		this.addAllInListAsButtons(EqualizerPresetList, this.EqualizerPresetMenu);

		//Separation
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		//Add settings button
		this.settingsButton = new PopupMenu.PopupMenuItem(_('Settings'));
		this.settingsButton.connect('activate', () => {
			this._extension.openPreferences();
		})
		this.menu.addMenuItem(this.settingsButton);

		//We add the box to the panel
		this.add_child(box);

		//We apply the settings.
		this._settings = this._extension.getSettings();
		this._settings.connect('changed', this.applyNewPosition.bind(this));
		this._settingsChangedId = this._settings.connect('changed', this.applySettings.bind(this));
		this.applySettings();

		//Logs that startup was successful.
		logIfEnabled("info","Startup successful.");
	}

	//Allows turning our lists of modes/presets into actual buttons
	addAllInListAsButtons (List, Submenu) {
		for (let i = 0; i < List.length; i++) {
			//Creates the button
			this.Button = new PopupMenu.PopupMenuItem(List[i].label);

			//Adds it to its respective submenu
			Submenu.menu.box.add(this.Button);
			
			//Binds button to command
			this.Button.connect('activate', () => {
				this.signalHandler(List[i].signal)
			})
		}
	}

	signalHandler (signal) {
		logIfEnabled("debug","Preparing to send signal : ["+signal+"]");

		//Detect connected Bluetooth devices using GnomeBluetooth, and extract MAC address of first Soundcore device
		const devicesObject = gatherBluetoothDevices();
		if (devicesObject == "failed") {
			return;
		}

		//Convert object into array
		const devices = devicesObjectToArray(devicesObject)
		
		let hasFoundAtLeastOneDevice = false;
		for (let i = 0; i < devices.length; i++) {
			//For every compatible device, send a signal
			if (devices[i].connected && devices[i].paired && SupportedDeviceNames.includes(devices[i].name)) {
				//We found a compatible device.
				hasFoundAtLeastOneDevice = true;
				logIfEnabled("info","Sending signal : ["+signal+"] to device named ["+devices[i].name+"] with MAC address ["+devices[i].address+"]");

				sendSignal(signal, devices[i].address);
			}
		}

		//If we DID find devices, but none were compatible.
		if (hasFoundAtLeastOneDevice == false) {
			logIfEnabled("warn","No compatible devices found.");
			Main.notifyError(_("Noiseclapper - Error"),_("No connected compatible devices found."));
		}
	}

	applySettings(){
		POSITION = this._settings.get_int('position');
		POSITION_NUMBER = this._settings.get_int('position-number');
		LOGGING = this._settings.get_boolean('logging-enabled');
		logIfEnabled("info","Settings applied.");
	}

	applyNewPosition(){
		this.container.get_parent().remove_actor(this.container);
		const boxes = {
			0: Main.panel._leftBox,
			1: Main.panel._centerBox,
			2: Main.panel._rightBox
		};
		const p = this._settings.get_int('position');
		const i = this._settings.get_int('position-number');
		boxes[p].insert_child_at_index(this.container, i);
	}

	//Allows the extension to be disabled.
	_destroy () {
		super._destroy();
	}
});
