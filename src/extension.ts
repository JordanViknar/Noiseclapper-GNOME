//------------------------- Imports ----------------------------
// External
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';

// Internal
import NoiseclapperIndicator from './indicator.js';
import {LogType, logIfEnabled, devicesObjectToArray, sendSignal, SupportedDeviceNames, updateLogging} from './common.js';
import GnomeBluetooth from 'gi://GnomeBluetooth'

// ----------------------- Extension -----------------------
export default class NoiseclapperExtension extends Extension {
	private BluetoothClient?: GnomeBluetooth.Client;
	private Indicator?: InstanceType<typeof NoiseclapperIndicator>;
	public settings = this.getSettings();
	private settings_handler?: Gio.SettingsBindFlags;

	enable() {
		logIfEnabled(LogType.Info,"Enabling Noiseclapper...");

		// We enable the bluetooth client
		logIfEnabled(LogType.Debug,"Enabling Bluetooth client...");
		this.BluetoothClient = new GnomeBluetooth.Client();

		// And create the indicator
		logIfEnabled(LogType.Debug,"Creating and adding Noiseclapper indicator...");
		this.Indicator = new NoiseclapperIndicator(this);
		Main.panel.addToStatusArea(this.uuid, this.Indicator);

		// Apply settings and position
		this.settings_handler = this.settings.connect('changed', this.applySettings.bind(this));
		this.applySettings();

		//Logs that startup was successful.
		logIfEnabled(LogType.Info,"Startup successful.");
	}

	disable() {
		logIfEnabled(LogType.Info,"Disabling Noiseclapper...");
		
		//Disable Bluetooth client if enabled
		if (this.BluetoothClient != undefined) {this.BluetoothClient = undefined;}

		//Remove the indicator
		logIfEnabled(LogType.Debug,"Removing Noiseclapper indicator...");
		this.Indicator?.destroy();
		this.Indicator = undefined;

		// Disconnect settings change handler
		if (this.settings_handler != undefined) {this.settings.disconnect(this.settings_handler);this.settings_handler = undefined;}
	}

	signalHandler(signal: string) {
		logIfEnabled(LogType.Debug,"Preparing to send signal : ["+signal+"]");
		
		const devices = devicesObjectToArray(this.BluetoothClient!.get_devices());
		
		let hasFoundAtLeastOneDevice = false;
		for (const device of devices) {
			if (device.connected && device.paired && SupportedDeviceNames.includes(device.name!)) {
				hasFoundAtLeastOneDevice = true;

				const { name, address } = device;
				logIfEnabled(LogType.Info, `Sending signal: [${signal}] to device named [${name}] with MAC address [${address}]`);
				sendSignal(signal, address!);
			}
		}

		//If we DID find devices, but none were compatible.
		if (hasFoundAtLeastOneDevice == false) {
			logIfEnabled(LogType.Error,"No compatible devices found.");
			Main.notifyError("Noiseclapper - "+_("Error"),_("No connected compatible devices found."));
		}
	}

	applySettings() {
		updateLogging(this.settings.get_boolean('logging-enabled'));
		this.Indicator!.applyPosition();
	}
}