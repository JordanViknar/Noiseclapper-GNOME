// ------------------------- Imports ----------------------------
import Gtk from 'gi://Gtk';
import type Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// ----------------------- Preferences ----------------------------
export default class NoiseclapperPreferences extends ExtensionPreferences {
	fillPreferencesWindow(window: Adw.PreferencesWindow) {
		// Prepare labels and controls
		const buildable = new Gtk.Builder();
		buildable.add_from_file(this.dir.get_path() + '/prefs.ui');

		// Connect widgets to variables
		const aboutName = buildable.get_object('about_name')! as Gtk.Label;
		const aboutVersion = buildable.get_object('about_version')! as Gtk.Label;
		const aboutDescription = buildable.get_object(
			'about_description',
		)! as Gtk.Label;
		const aboutUrl = buildable.get_object('about_url')! as Gtk.Label;

		const pageBasic = buildable.get_object(
			'page_basic',
		)! as Adw.PreferencesPage;
		const pageAbout = buildable.get_object(
			'page_about',
		)! as Adw.PreferencesPage;

		// Configure dynamic widgets
		aboutName.set_text(this.metadata.name.toString());
		if (this.metadata.version !== undefined)
			aboutVersion.set_text(this.metadata.version.toString());
		aboutDescription.set_text(this.metadata.description.toString());
		const url = this.metadata.url!.toString();
		aboutUrl.set_markup('<a href="' + url + '">' + url + '</a>');

		// Bind fields to settings
		const settings = this.getSettings();
		settings.bind(
			'position',
			buildable.get_object('field_position')!,
			'selected',
			Gio.SettingsBindFlags.DEFAULT,
		);
		settings.bind(
			'position-number',
			buildable.get_object('field_position_number')!,
			'value',
			Gio.SettingsBindFlags.DEFAULT,
		);
		settings.bind(
			'logging-enabled',
			buildable.get_object('field_logging')!,
			'active',
			Gio.SettingsBindFlags.DEFAULT,
		);

		window.add(pageBasic);
		window.add(pageAbout);
	}
}
