// ------------------------- Imports ----------------------------
// External
import type Gio from "gi://Gio";
import GnomeBluetooth from "gi://GnomeBluetooth";
import {
	Extension,
	gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import { notifyError, panel } from "resource:///org/gnome/shell/ui/main.js";
import {
	LogType,
	logIfEnabled,
	updateLogging,
} from "./common.js";
// Internal
import NoiseclapperIndicator from "./indicator.js";
import { OpenSCQ30Client } from "./clients.js"

// ----------------------- Extension -----------------------
export default class NoiseclapperExtension extends Extension {
	public settings?: Gio.Settings;
	private bluetoothClient?: GnomeBluetooth.Client;
	private indicator?: InstanceType<typeof NoiseclapperIndicator>;
	private settingsHandler?: Gio.SettingsBindFlags;

	async enable() {
		logIfEnabled(LogType.Info, "Enabling Noiseclapper...");

		// We enable the bluetooth client
		logIfEnabled(LogType.Debug, "Enabling Bluetooth client...");
		this.bluetoothClient = new GnomeBluetooth.Client();


		// And create the indicator
		logIfEnabled(
			LogType.Debug,
			"Creating and adding Noiseclapper indicator...",
		);

		// Apply settings and position
		this.settings = this.getSettings();
		this.settingsHandler = this.settings.connect(
			"changed",
			this.applySettings.bind(this),
		);

		let path
		try {
			path = this.settings!.get_string("openscq30")
		} catch(e) {
			path = "openscq30"
		}
		const openSCQ30Client = new OpenSCQ30Client(path)

		this.indicator = new NoiseclapperIndicator(this, this.bluetoothClient!, await openSCQ30Client.isWorking() ? openSCQ30Client : undefined);
		panel.addToStatusArea(this.uuid, this.indicator);

		this.applySettings();
	
		logIfEnabled(LogType.Info, "Startup successful.");
	}

	disable() {
		logIfEnabled(LogType.Info, "Disabling Noiseclapper...");

		// Disable Bluetooth client if enabled
		this.bluetoothClient = undefined;

		// Remove the indicator
		logIfEnabled(LogType.Debug, "Removing Noiseclapper indicator...");
		this.indicator?.destroy();
		this.indicator = undefined;

		// Disconnect settings change handler
		if (this.settingsHandler !== undefined) {
			this.settings!.disconnect(this.settingsHandler);
			this.settingsHandler = undefined;
		}

		this.settings = undefined;
	}

	applySettings() {
		logIfEnabled(LogType.Debug, "Applying settings...");

		updateLogging(this.settings!.get_boolean("logging-enabled"));

		this.indicator!.applyPosition();
	}
}
