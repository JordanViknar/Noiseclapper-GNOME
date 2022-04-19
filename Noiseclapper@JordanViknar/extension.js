//----------------------------Default Settings------------------------------
let PYTHON_TYPE="python3"
let DEBUG_TERMINAL=false
let MAC=""
let POSITION = 2;
let POSITION_NUMBER = 0;

//------------------------------Libraries----------------------------
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
//const Gtk = imports.gi.Gtk;
const Main = imports.ui.main;
//const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
//const MessageTray = imports.ui.messageTray;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
//const ExtensionManager = imports.ui.main.extensionManager;
const Me = ExtensionUtils.getCurrentExtension();
//const Format = imports.format;
//const Gettext = imports.gettext.domain('noiseclapper');
//const _ = Gettext.gettext;


//---------------------Extension Initialization---------------------
function init () {
	//String.prototype.format = Format.format;
	//ExtensionUtils.initTranslations("noiseclapper");
}

const API_NOISE_REDUCTION=Me.dir.get_path()+"/soundcore-life-api/AnkerSoundcoreAPI.py -AmbientSound"
const API_EQUALIZER=Me.dir.get_path()+"/soundcore-life-api/AnkerSoundcoreAPI.py -EQPresets"

//------------------------Indicator Setup---------------------------
const NoiseclapperIndicator = GObject.registerClass({},
class NoiseclapperIndicator extends PanelMenu.Button {
	_init () {
		super._init(0);
		console.log("[Noiseclapper] Initializing...");

		//This will add a box object to the panel. It's basically the extension's button.
		let box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });

		//We create the emoji icon in the status box.
		this.label = new St.Label({ text: '🔇👏',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER });
		box.add_actor(this.label);

		//Noiseclapper Title
		this.NoiseclapperTitle = new PopupMenu.PopupMenuItem(_('Noiseclapper 🔇👏'));
		this.NoiseclapperTitle.reactive = false;
		this.menu.addMenuItem(this.NoiseclapperTitle);

		//The 2 submenus
		this.NoiseCancellationModeMenu = new PopupMenu.PopupSubMenuMenuItem('Noise Cancellation Mode');
		this.menu.addMenuItem(this.NoiseCancellationModeMenu);
		this.EqualizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem('Equalizer Preset');
		this.menu.addMenuItem(this.EqualizerPresetMenu);

		//The submenus' mode/preset lists
		let NoiseCancellationModeList = [
			{ label: '🚋 Transport', command: 'ANCTransport' },
			{ label: '🏠 Indoor', command: 'ANCIndoor' },
			{ label: '🌳 Outdoor', command: 'ANCOutdoor' },
			{ label: '🔇 Default', command: 'ANC'},
			{ label: '🚫 Normal / No ANC', command: 'Normal' },
			{ label: '🪟 Transparency / No NC', command: 'Transparency' },
		];
		this._addAllInListAsButtons(NoiseCancellationModeList, this.NoiseCancellationModeMenu, API_NOISE_REDUCTION);

		let EqualizerPresetList = [
			{ label: '🎵 Soundcore Signature', command: 'SoundCore Signature' },
			{ label: '🎸 Acoustic', command: 'Acoustic' },
			{ label: '🎸 Bass Booster', command: 'Base Booster' },
			{ label: '🚫 Bass Reducer', command: 'Base Reducer' },
			{ label: '🎻 Classical', command: 'Classical' },
			{ label: '🎤 Podcast', command: 'Podcast' },
			{ label: '🪩 Dance', command: 'Dance' },
			{ label: '🖴 Deep', command: 'Deep' },
			{ label: '⚡ Electronic', command: 'Electronic' },
			{ label: '🚫 Flat', command: 'Flat' },
			{ label: '🎹 Hip-Hop', command: 'Hip-hop' },
			{ label: '🎷 Jazz', command: 'Jazz' },
			{ label: '💃🏽 Latin', command: 'Latin' },
			{ label: '🍸 Lounge', command: 'Lounge' },
			{ label: '🎹 Piano', command: 'Piano' },
			{ label: '🎸 Pop', command: 'Pop' },
			{ label: '🎹 RnB', command: 'R+B' },
			{ label: '🎸 Rock', command: 'Rock' },
			{ label: '🔉 Small Speaker(s)', command: 'Small Speakers' },
			{ label: '👄 Spoken Word', command: 'Spoken Word' },
			{ label: '🎼 Treble Booster', command: 'Treble Booster' },
			{ label: '🚫 Treble Reducer', command: 'Treble Reducer' },
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
		console.log("[Noiseclapper] Grabbing Noiseclapper settings...");
		this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.noiseclapper');
		this._settings.connect('changed', this._PositionChanged.bind(this));
		this._settingsChangedId = this._settings.connect('changed', this._ApplySettings.bind(this));
		this._ApplySettings();
	}

	//Allows turning our lists of modes/presets into actual buttons
	_addAllInListAsButtons (List, Submenu, APItoUse) {
		for (let i = 0; i < List.length; i++) {
			//Creates the button
			this.Button = new PopupMenu.PopupMenuItem(_(List[i].label));

			//Adds it to its respective submenu
			Submenu.menu.box.add(this.Button);
			
			//Binds button to command
			this.Button.connect('activate', () => {
				this._runCommand(APItoUse+' "'+List[i].command+'"')
			})
		}
	}

	_runCommand (command) {
		command = PYTHON_TYPE+" "+command+" "+MAC
		
		if (DEBUG_TERMINAL == true){
			//This will execute the command in the GNOME terminal, allowing easy error diagnosis... most of the time.
			command = "gnome-terminal -- /bin/sh -c '"+command+" ; echo Done - Press enter to exit; read _'"
		} else {
			//This will run the command in the background, without getting in the user's way.
			command = "/bin/sh -c '"+command+"'";
		}
		//Logging to the GNOME Shell journal
		console.log("[Noiseclapper] Attempting to run : "+command);

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

	_ApplySettings () {
		MAC = this._settings.get_string('mac-address');

		POSITION = this._settings.get_int('position');
		POSITION_NUMBER = this._settings.get_int('position-number');

		DEBUG_TERMINAL = this._settings.get_boolean('terminal-enabled');
		if (this._settings.get_int('python-type') == 0) {
			PYTHON_TYPE = "python3";
		} else {
			PYTHON_TYPE = "python";
		}

		console.log("[Noiseclapper] Settings applied.");
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
	console.log("[Noiseclapper] Noiseclapper is enabled. Spawning indicator...");

	//Creates the indicator
	noiseclapperindicator = new NoiseclapperIndicator();
	//Adds it to the panel
	Main.panel.addToStatusArea('NoiseclapperIndicator', noiseclapperindicator);
	//Sets position
	noiseclapperindicator._PositionChanged()
}

//------------------------Disabling Extension------------------------
function disable() {
	noiseclapperindicator.destroy();
}