const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Gettext = imports.gettext.domain("Noiseclapper");
const _ = Gettext.gettext;

let settings;

function init() {
	ExtensionUtils.initTranslations("Noiseclapper");
}

function buildPrefsWidget(){
	settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.noiseclapper');

	// Prepare labels and controls
	let buildable = new Gtk.Builder();
	buildable.add_from_file( Me.dir.get_path() + '/prefs.ui' );
	let box = buildable.get_object('prefs_widget');

	// Bind fields to settings
	settings.bind('position' , buildable.get_object('field_position') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('position-number' , buildable.get_object('field_position_number') , 'value' , Gio.SettingsBindFlags.DEFAULT);

	settings.bind('python-type' , buildable.get_object('field_python_type') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('terminal-enabled' , buildable.get_object('field_terminal') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	settings.bind('logging-enabled' , buildable.get_object('field_logging') , 'active' , Gio.SettingsBindFlags.DEFAULT);

	return box;
};