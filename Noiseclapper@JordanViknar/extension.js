//Some nice library imports here
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

//Extension initialization
function init () {
	//String.prototype.format = Format.format;
	//ExtensionUtils.initTranslations("noiseclapper");
}

//The magic is here.
const NoiseclapperIndicator = GObject.registerClass({},
class NoiseclapperIndicator extends PanelMenu.Button {
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

		//We add the box to the panel
		this.add_child(box);
	}
});


let noiseclapperindicator;
function enable() {
	noiseclapperindicator = new NoiseclapperIndicator();
	Main.panel.addToStatusArea('NoiseclapperIndicator', noiseclapperindicator);
}

function disable() {}