// ------------------------- Imports ----------------------------
// External
import type Gio from "gi://Gio";
import GnomeBluetooth from "gi://GnomeBluetooth";
import {
	gettext as _,
	Extension,
} from "resource:///org/gnome/shell/extensions/extension.js";
import { notifyError, panel } from "resource:///org/gnome/shell/ui/main.js";
import {
	devicesObjectToArray,
	LogType,
	logIfEnabled,
	sendSignal,
	supportedDeviceNames,
	updateLogging,
} from "./common.js";
// Internal
import NoiseclapperIndicator from "./indicator.js";

// Panel side for each value of the "position" setting
const panelBoxes = ["left", "center", "right"] as const;

// ----------------------- Extension -----------------------
export default class NoiseclapperExtension extends Extension {
	public settings?: Gio.Settings;
	private bluetoothClient?: GnomeBluetooth.Client;
	private indicator?: NoiseclapperIndicator;
	private settingsHandler?: number;

	enable() {
		// Settings come first, as they decide the logging and the indicator position
		this.settings = this.getSettings();
		updateLogging(this.settings.get_boolean("logging-enabled"));
		logIfEnabled(LogType.Info, "Enabling Noiseclapper...");

		// We enable the bluetooth client
		logIfEnabled(LogType.Debug, "Enabling Bluetooth client...");
		this.bluetoothClient = new GnomeBluetooth.Client();

		// And create the indicator
		this.addIndicator();

		this.settingsHandler = this.settings.connect(
			"changed",
			(_settings, key) => {
				this.onSettingChanged(key);
			},
		);

		logIfEnabled(LogType.Info, "Startup successful.");
	}

	disable() {
		logIfEnabled(LogType.Info, "Disabling Noiseclapper...");

		// Disable Bluetooth client if enabled
		this.bluetoothClient = undefined;

		// Remove the indicator
		this.removeIndicator();

		// Disconnect settings change handler
		if (this.settingsHandler !== undefined) {
			this.settings!.disconnect(this.settingsHandler);
			this.settingsHandler = undefined;
		}

		this.settings = undefined;
	}

	private addIndicator() {
		logIfEnabled(
			LogType.Debug,
			"Creating and adding Noiseclapper indicator...",
		);

		const position = this.settings!.get_int("position");
		const index = this.settings!.get_int("position-number");

		this.indicator = new NoiseclapperIndicator(this);
		panel.addToStatusArea(
			this.uuid,
			this.indicator,
			index,
			panelBoxes[position] ?? "right",
		);
	}

	private removeIndicator() {
		logIfEnabled(LogType.Debug, "Removing Noiseclapper indicator...");

		this.indicator?.destroy();
		this.indicator = undefined;
	}

	private onSettingChanged(key: string) {
		logIfEnabled(LogType.Debug, `Setting changed: [${key}]`);

		switch (key) {
			case "logging-enabled": {
				updateLogging(this.settings!.get_boolean(key));
				break;
			}

			case "position":
			case "position-number": {
				this.removeIndicator();
				this.addIndicator();
				break;
			}

			default: {
				break;
			}
		}
	}

	signalHandler(signal: string) {
		logIfEnabled(LogType.Debug, `Preparing to send signal : [${signal}]`);

		const devices = devicesObjectToArray(
			this.bluetoothClient!.get_devices() as unknown as Gio.ListStore,
		);

		let hasFoundAtLeastOneDevice = false;
		for (const device of devices) {
			if (device.connected && supportedDeviceNames.includes(device.name!)) {
				hasFoundAtLeastOneDevice = true;

				const { name, address } = device;
				logIfEnabled(
					LogType.Info,
					`Sending signal [${signal}] to device [${name}] with MAC address [${address}]`,
				);
				sendSignal(signal, address!).catch((error) => {
					logIfEnabled(LogType.Error, `Failed to send signal: ${error}`);
				});
			}
		}

		if (!hasFoundAtLeastOneDevice) {
			logIfEnabled(LogType.Error, "No compatible devices found.");
			notifyError(
				`Noiseclapper - ${_("Error")}`,
				_("No connected compatible devices found."),
			);
		}
	}
}
