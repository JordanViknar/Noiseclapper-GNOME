//------------------------- Imports ----------------------------
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

import {ExtensionPreferences} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"

//----------------------- Preferences ----------------------------
export default class NoiseclapperPreferences extends ExtensionPreferences {
	fillPreferencesWindow(window: Adw.PreferencesWindow){
		// Prepare labels and controls
		let buildable = new Gtk.Builder();
		buildable.add_from_file( this.dir.get_path() + '/prefs.ui' );

		// Connect widgets to variables
		const about_name = buildable.get_object('about_name')! as Gtk.Label;
		const about_version = buildable.get_object('about_version')! as Gtk.Label;
		const about_description = buildable.get_object('about_description')! as Gtk.Label;
		const about_url = buildable.get_object('about_url')! as Gtk.Label;

		const page_basic = buildable.get_object('page_basic')! as Adw.PreferencesPage;
		const page_about = buildable.get_object('page_about')! as Adw.PreferencesPage;

		// Configure dynamic widgets
		about_name.set_text(this.metadata.name.toString());
		if (this.metadata.version != undefined) about_version.set_text(this.metadata.version.toString());
		about_description.set_text(this.metadata.description.toString());
		let url = this.metadata.url!.toString();
		about_url.set_markup("<a href=\"" + url + "\">" + url + "</a>");
	
		// Bind fields to settings
		let settings = this.getSettings();
		settings!.bind('position' , buildable.get_object('field_position')! , 'selected' , Gio.SettingsBindFlags.DEFAULT);
		settings!.bind('position-number' , buildable.get_object('field_position_number')! , 'value' , Gio.SettingsBindFlags.DEFAULT);
		settings!.bind('logging-enabled' , buildable.get_object('field_logging')! , 'active' , Gio.SettingsBindFlags.DEFAULT);
	
		window.add(page_basic);
		window.add(page_about);
	};
}