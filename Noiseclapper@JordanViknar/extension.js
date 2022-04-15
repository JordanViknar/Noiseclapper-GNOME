//------------------------------Libraries----------------------------
const Clutter = imports.gi.Clutter;

const St = imports.gi.St;
const GObject = imports.gi.GObject;
//const GLib = imports.gi.GLib;
//const Gio = imports.gi.Gio;
//const Gtk = imports.gi.Gtk;

const Main = imports.ui.main;
//const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
//const MessageTray = imports.ui.messageTray;

//const Util = imports.misc.util;
//const ExtensionUtils = imports.misc.extensionUtils;
//const ExtensionManager = imports.ui.main.extensionManager;
//const Me = ExtensionUtils.getCurrentExtension();

//const Format = imports.format;
//const Gettext = imports.gettext.domain('noiseclapper');
//const _ = Gettext.gettext;

//---------------------Extension Initialization---------------------
function init () {}

//------------------------Indicator Setup---------------------------
const NoiseclapperIndicator = GObject.registerClass({},
class NoiseclapperIndicator extends PanelMenu.Button {
	_addAllInListAsButtons (List, Submenu, APItoUse) {
		for (let i = 0; i < List.length; i++) {
			this.Normal = new PopupMenu.PopupMenuItem(_(List[i].label));
			Submenu.menu.box.add(this.Normal);
		}
	}

	_init () {
		super._init(0);
		
		//This will add a box object to the panel. It's basically the extension's button.
		let box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });

		//We define a label for the box
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

		//The submenus' buttons
		let NoiseCancellationModeList = [
			{ label: '🚋 Transport', command: 'ANCTransport' },
			{ label: '🏠 Indoor', command: 'ANCIndoor' },
			{ label: '🌳 Outdoor', command: 'ANCOutdoor' },
			{ label: '🔇 Default', command: 'ANC'},
			{ label: '🚫 Normal / No ANC', command: 'Normal' },
			{ label: '🪟 Transparency / No NC', command: 'Transparency' },
		];
		this._addAllInListAsButtons(NoiseCancellationModeList, this.NoiseCancellationModeMenu);

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
		this._addAllInListAsButtons(EqualizerPresetList, this.EqualizerPresetMenu);

		//We add the box to the panel
		this.add_child(box);
	}
});

//-----------------------Enabling Extension-------------------------
let noiseclapperindicator;
function enable() {
	noiseclapperindicator = new NoiseclapperIndicator();
	Main.panel.addToStatusArea('NoiseclapperIndicator', noiseclapperindicator);
}

//------------------------Disabling Extension------------------------
function disable() {}