//------------------------------Libraries----------------------------
// GI Libraries
import St from 'gi://St'
import GObject from 'gi://GObject'
import Gio from 'gi://Gio'
import GnomeBluetooth from 'gi://GnomeBluetooth'

// Native GNOME Shell Modules
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';
import {Extension, gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

//------------------------------Variables----------------------------
let LOGGING: boolean;
const SupportedDeviceNames: string[] = [
	"Soundcore Life Q35",		//Not tested
	"Soundcore Life Q30",
	"Soundcore Life Q20+",		//Not tested
	"Soundcore Life Q20",		//Not tested
	"Soundcore Life Q10",		//Not tested, only partially compatible
	"BES_BLE"					//Buggy name sometimes applied to the Q30
]

//------------------------Util Functions------------------------
enum LogType {
	Info,
	Warn,
	Error,
	Debug
}
function logIfEnabled(type: LogType, message: string) {
	if (LOGGING == true) {
		switch(type) {
			default:
				console.log("[Noiseclapper] "+message);
				break;
			case LogType.Info:
				console.info("[Noiseclapper] "+message);
				break;
			case LogType.Warn:
				console.warn("[Noiseclapper] "+message);
				break;
			case LogType.Error:
				console.error("[Noiseclapper] "+message);
				break;
			case LogType.Debug:
				console.debug("[Noiseclapper] "+message);
				break;
		}
	}
}

//------------------------Bluetooth Functions------------------------
function gatherBluetoothDevices(): Gio.ListStore<GnomeBluetooth.Device> | undefined {
	try {
		logIfEnabled(LogType.Info,"Obtaining connected devices...");
		return NoiseclapperBluetoothClient!.get_devices();
	} catch (error: any) {
		logIfEnabled(LogType.Error,"Could not get Bluetooth devices : " + error);
		Main.notifyError(_('Noiseclapper - Error'), error.message);
		return undefined;
	}
}

function devicesObjectToArray(object: Gio.ListStore<GnomeBluetooth.Device>): (GnomeBluetooth.Device | null)[] {
	const numberOfDevices = object.get_n_items()

	let devices = []
	for (let i = 0; i < numberOfDevices; i++) {
		devices.push(object.get_item(i))
	}

	return devices
}

function sendSignal(signal: string, address: string) {
	const command = "python3 -c \"import socket;\
	s = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM);\
	s.connect((\'"+address+"\', 12));\
	s.send(bytearray.fromhex(\'"+signal+"\'));\
	s.close();\"";

	Util.spawnCommandLine(command);
}

//--------------------- Enable and Disable functions ---------------------
let NoiseclapperIndicatorStorage: NoiseclapperIndicator | undefined;
let NoiseclapperBluetoothClient: GnomeBluetooth.Client | undefined;
export default class Noiseclapper extends Extension {
	private button: PanelMenu.Button;

	public enable() {
		logIfEnabled(LogType.Info,"Enabling Noiseclapper...");
	
		//We enable the bluetooth client
		logIfEnabled(LogType.Debug,"Enabling Bluetooth client...");
		NoiseclapperBluetoothClient = new GnomeBluetooth.Client();
	
		//Creates the indicator
		logIfEnabled(LogType.Debug,"Creating and adding Noiseclapper indicator...");
		NoiseclapperIndicatorStorage = new NoiseclapperIndicator.init(this);
		//Adds it to the panel
		Main.panel.addToStatusArea('NoiseclapperIndicator', NoiseclapperIndicatorStorage);
		//Sets position
		NoiseclapperIndicatorStorage!.applyNewPosition()
	}

	public disable() {
		logIfEnabled(LogType.Info,"Disabling Noiseclapper...");

		//Disable Bluetooth client if enabled
		if (NoiseclapperBluetoothClient != undefined) {
			NoiseclapperBluetoothClient = undefined;
		}

		//Removes the indicator
		logIfEnabled(LogType.Debug,"Removing Noiseclapper indicator...");
		NoiseclapperIndicatorStorage!.destroy();
		NoiseclapperIndicatorStorage = undefined;
	}

	private signalHandler (signal: string) {
		logIfEnabled(LogType.Info,"Preparing to send signal : ["+signal+"]");

		//Detect connected Bluetooth devices using GnomeBluetooth, and extract MAC address of first Soundcore device
		const devicesObject = gatherBluetoothDevices();
		if (devicesObject == undefined) { return; }

		//Convert object into array
		const devices = devicesObjectToArray(devicesObject)
		
		let hasFoundAtLeastOneDevice = false;
		for (let device of devices) {
			if (device == undefined) { continue; }
			if (device.connected && device.paired && SupportedDeviceNames.includes(device.name)) {
				//We found a compatible device.
				hasFoundAtLeastOneDevice = true;
				logIfEnabled(LogType.Info,"Sending signal : ["+signal+"] to device named ["+device.name+"] with MAC address ["+device.address+"]");
		}

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
}

//------------------------Indicator Setup---------------------------
class NoiseclapperIndicator extends PanelMenu.Button {
	private gsettings?: Gio.Settings;
	private extension?: Noiseclapper;

	init(extension: Noiseclapper) {
		logIfEnabled(LogType.Debug, "Initializing Noiseclapper indicator...");
		super._init();
		this.extension = extension;
	}
	
	applyNewPosition(){
		this.container.get_parent()!.remove_actor(this.container);
		const boxes = {
			0: Main.panel._leftBox,
			1: Main.panel._centerBox,
			2: Main.panel._rightBox
		};
		const p = this.gsettings!.get_int('position');
		const i = this.gsettings!.get_int('position-number');
		boxes[p].insert_child_at_index(this.container, i);
	}

	//Allows the extension to be disabled.
	destroy() {
		super.destroy();
	}
}
const NoiseclapperIndicatorRegister = GObject.registerClass({}, NoiseclapperIndicator);