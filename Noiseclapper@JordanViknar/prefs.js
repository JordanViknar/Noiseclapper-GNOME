// GI Library Imports
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

// Extension Libraries
import {ExtensionPreferences} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

export default class NoiseclapperPreferences extends ExtensionPreferences {
	fillPreferencesWindow(window){
		// Prepare labels and controls
		let buildable = new Gtk.Builder();
		buildable.add_from_file( this.dir.get_path() + '/prefs.ui' );

		// Configure dynamic widgets
		buildable.get_object('about_name').set_text(this.metadata.name.toString());
		buildable.get_object('about_version').set_text(this.metadata.version.toString());
		buildable.get_object('about_description').set_text(this.metadata.description.toString());
		buildable.get_object('about_url').set_markup("<a href=\"" + this.metadata.url.toString() + "\">" + this.metadata.url.toString() + "</a>");
	
		// Bind fields to settings
		let settings = this.getSettings();
		settings.bind('position' , buildable.get_object('field_position') , 'active' , Gio.SettingsBindFlags.DEFAULT);
		settings.bind('position-number' , buildable.get_object('field_position_number') , 'value' , Gio.SettingsBindFlags.DEFAULT);
		settings.bind('python-type' , buildable.get_object('field_python_type') , 'active' , Gio.SettingsBindFlags.DEFAULT);
		settings.bind('terminal-enabled' , buildable.get_object('field_terminal') , 'active' , Gio.SettingsBindFlags.DEFAULT);
		settings.bind('logging-enabled' , buildable.get_object('field_logging') , 'active' , Gio.SettingsBindFlags.DEFAULT);
	
		window.add(buildable.get_object('page_basic'));
		window.add(buildable.get_object('page_about'));
	};
}