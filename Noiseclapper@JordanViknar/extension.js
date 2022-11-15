//----------------------------Default Settings------------------------------
let PYTHON_TYPE="python3"
let DEBUG_TERMINAL=false
let POSITION = 2;
let POSITION_NUMBER = 0;
let LOGGING = false;

//------------------------------Libraries----------------------------
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Format = imports.format;
const GnomeBluetooth = imports.gi.GnomeBluetooth;

//Used for translations
const Gettext = imports.gettext.domain("Noiseclapper");
const _ = Gettext.gettext;

//---------------------Extension Initialization---------------------
function init () {
	String.prototype.format = Format.format;

	//Initiate translations
	ExtensionUtils.initTranslations("Noiseclapper");
}

//APIs
const API_NOISE_REDUCTION=Me.dir.get_path()+"/soundcore-life-api/AnkerSoundcoreAPI.py -AmbientSound"
const API_EQUALIZER=Me.dir.get_path()+"/soundcore-life-api/AnkerSoundcoreAPI.py -EQPresets"
//Bluetooth
let NoiseclapperBluetoothClient = null
//Supported Devices
const SupportedDeviceNames = [
	"Soundcore Life Q30",
	"BES_BLE" //Buggy name sometimes applied to the Q30
]

//------------------------Indicator Setup---------------------------
const NoiseclapperIndicator = GObject.registerClass({},
class NoiseclapperIndicator extends PanelMenu.Button {
	_init () {
		super._init(0);

		//This will add a box object to the panel. It's basically the extension's button.
		let box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });

		//We create the emoji icon in the status box.
		this.label = new St.Label({ text: '🔇👏',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER });
		box.add_actor(this.label);

		//Noiseclapper Title
		this.NoiseclapperTitle = new PopupMenu.PopupMenuItem('Noiseclapper 🔇👏');
		this.NoiseclapperTitle.reactive = false;
		this.menu.addMenuItem(this.NoiseclapperTitle);

		//The 2 submenus
		this.NoiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(_('Noise Cancelling Mode'));
		this.menu.addMenuItem(this.NoiseCancellingModeMenu);
		this.EqualizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(_('Equalizer Preset'));
		this.menu.addMenuItem(this.EqualizerPresetMenu);

		//The submenus' mode/preset lists
		let NoiseCancellingModeList = [
			{ label: _('🚋 Transport'), command: 'ANCTransport' },
			{ label: _('🏠 Indoor'), command: 'ANCIndoor' },
			{ label: _('🌳 Outdoor'), command: 'ANCOutdoor' },
			{ label: _('🔇 Default'), command: 'ANC'},
			{ label: _('🚫 Normal / No ANC'), command: 'Normal' },
			{ label: _('🪟 Transparency / No NC'), command: 'Transparency' },
		];
		this._addAllInListAsButtons(NoiseCancellingModeList, this.NoiseCancellingModeMenu, API_NOISE_REDUCTION);

		let EqualizerPresetList = [
			{ label: _('🎵 Soundcore Signature'), command: 'SoundCore Signature' },
			{ label: _('🎸 Acoustic'), command: 'Acoustic' },
			{ label: _('🎸 Bass Booster'), command: 'Base Booster' },
			{ label: _('🚫 Bass Reducer'), command: 'Base Reducer' },
			{ label: _('🎻 Classical'), command: 'Classical' },
			{ label: _('🎤 Podcast'), command: 'Podcast' },
			{ label: _('🪩 Dance'), command: 'Dance' },
			{ label: _('🖴 Deep'), command: 'Deep' },
			{ label: _('⚡ Electronic'), command: 'Electronic' },
			{ label: _('🚫 Flat'), command: 'Flat' },
			{ label: _('🎹 Hip-Hop'), command: 'Hip-hop' },
			{ label: _('🎷 Jazz'), command: 'Jazz' },
			{ label: _('💃🏽 Latin'), command: 'Latin' },
			{ label: _('🍸 Lounge'), command: 'Lounge' },
			{ label: _('🎹 Piano'), command: 'Piano' },
			{ label: _('🎸 Pop'), command: 'Pop' },
			{ label: _('🎹 RnB'), command: 'R+B' },
			{ label: _('🎸 Rock'), command: 'Rock' },
			{ label: _('🔉 Small Speaker(s)'), command: 'Small Speakers' },
			{ label: _('👄 Spoken Word'), command: 'Spoken Word' },
			{ label: _('🎼 Treble Booster'), command: 'Treble Booster' },
			{ label: _('🚫 Treble Reducer'), command: 'Treble Reducer' },
		]
		this._addAllInListAsButtons(EqualizerPresetList, this.EqualizerPresetMenu, API_EQUALIZER);

		//Add settings button
		this.settingsButton = new PopupMenu.PopupMenuItem(_('Settings'));
		this.settingsButton.connect('activate', () => {
			this._OpenSettings();
		})
		this.menu.addMenuItem(this.settingsButton);

		//We add the box to the panel
		this.add_child(box);

		//We apply the settings.
		this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.noiseclapper');
		this._settings.connect('changed', this._PositionChanged.bind(this));
		this._settingsChangedId = this._settings.connect('changed', this._ApplySettings.bind(this));
		this._ApplySettings();

		//Logs that startup was successful.
		if (LOGGING == true) {
			console.log("[Noiseclapper] Startup successful.");
		}
	}

	//Allows turning our lists of modes/presets into actual buttons
	_addAllInListAsButtons (List, Submenu, APItoUse) {
		for (let i = 0; i < List.length; i++) {
			//Creates the button
			this.Button = new PopupMenu.PopupMenuItem(List[i].label);

			//Adds it to its respective submenu
			Submenu.menu.box.add(this.Button);
			
			//Binds button to command
			this.Button.connect('activate', () => {
				this._runCommand(APItoUse+' "'+List[i].command+'"')
			})
		}
	}

	_runCommand (command) {
		//Detect connected Bluetooth devices using GnomeBluetooth, and extract MAC address of first Soundcore device
		let deviceObject = NoiseclapperBluetoothClient.get_devices()

		//CATCH sould be added

		//Convert object into array
		let numberOfDevices = deviceObject.get_n_items()
		let devices = []
		for (let i = 0; i < numberOfDevices; i++) {
			devices.push(deviceObject.get_item(i))
		}
		
		let MAC
		for (let i = 0; i < devices.length; i++) {
			if (devices[i].connected && devices[i].paired && SupportedDeviceNames.includes(devices[i].name)) {
				MAC = devices[i].address;
				if (LOGGING == true){
					console.log("[Noiseclapper] Found Soundcore device with MAC address "+MAC);
				}
			}
		}
		
		//SUPPORT FOR MULTIPLE DEVICES SHOULD BE ADDED

		command = PYTHON_TYPE+" "+command+" "+MAC
		
		if (DEBUG_TERMINAL == true){
			//ADD DETECTION AND USE OF GNOME-CONSOLE IF AVAILABLE

			//This will execute the command in the GNOME terminal, allowing easy error diagnosis... most of the time.
			command = "gnome-terminal -- /bin/sh -c '"+command+" ; echo Done - Press enter to exit; read _'"
		} else {
			//This will run the command in the background, without getting in the user's way.
			command = "/bin/sh -c '"+command+"'";
		}
		//Logging to the GNOME Shell journal
		if (LOGGING == true) {
			console.log("[Noiseclapper] Running : "+command);
		}

		//Actually runs the command
		Util.spawnCommandLine(command);
	}

	_OpenSettings () {
		Gio.DBus.session.call('org.gnome.Shell.Extensions','/org/gnome/Shell/Extensions','org.gnome.Shell.Extensions','OpenExtensionPrefs',
			new GLib.Variant('(ssa{sv})', [Me.uuid, '', {}]),
			null,
			Gio.DBusCallFlags.NONE,
			-1,
			null);
	}

	_ApplySettings(){
		POSITION = this._settings.get_int('position');
		POSITION_NUMBER = this._settings.get_int('position-number');

		DEBUG_TERMINAL = this._settings.get_boolean('terminal-enabled');
		if (this._settings.get_int('python-type') == 0) {
			PYTHON_TYPE = "python3";
		} else {
			PYTHON_TYPE = "python";
		}
		LOGGING = this._settings.get_boolean('logging-enabled');
		
		if (LOGGING == true) {
			console.log("[Noiseclapper] Settings applied.");
		}
	}

	_PositionChanged(){
		this.container.get_parent().remove_actor(this.container);
		let boxes = {
			0: Main.panel._leftBox,
			1: Main.panel._centerBox,
			2: Main.panel._rightBox
		};
		let p = this._settings.get_int('position');
		let i = this._settings.get_int('position-number');
		boxes[p].insert_child_at_index(this.container, i);
	}

	//Allows the extension to be disabled.
	_destroy () {
		super._destroy();
	}
});

//-----------------------Enabling Extension-------------------------
let noiseclapperindicator;
function enable() {
	if (LOGGING == true) {
		console.log("[Noiseclapper] Noiseclapper is enabled. Spawning indicator...");
	}

	//We enable the bluetooth client
	NoiseclapperBluetoothClient = new GnomeBluetooth.Client();

	//Creates the indicator
	noiseclapperindicator = new NoiseclapperIndicator();
	//Adds it to the panel
	Main.panel.addToStatusArea('NoiseclapperIndicator', noiseclapperindicator);
	//Sets position
	noiseclapperindicator._PositionChanged()
}

//------------------------Disabling Extension------------------------
function disable() {
	//Disable Bluetooth client if enabled


	noiseclapperindicator.destroy();
}