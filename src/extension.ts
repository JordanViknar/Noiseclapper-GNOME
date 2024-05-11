// ------------------------- Imports ----------------------------
// External
import type Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {
	Extension,
	gettext as _,
	ngettext,
	pgettext,
} from 'resource:///org/gnome/shell/extensions/extension.js';
import GnomeBluetooth from 'gi://GnomeBluetooth';
// Internal
import NoiseclapperIndicator from './indicator.js';
import {
	LogType,
	logIfEnabled,
	devicesObjectToArray,
	sendSignal,
	supportedDeviceNames,
	updateLogging,
} from './common.js';

// ----------------------- Extension -----------------------
export default class NoiseclapperExtension extends Extension {
	public settings?: Gio.Settings;
	private bluetoothClient?: GnomeBluetooth.Client;
	private indicator?: InstanceType<typeof NoiseclapperIndicator>;
	private settingsHandler?: Gio.SettingsBindFlags;

	enable() {
		logIfEnabled(LogType.Info, 'Enabling Noiseclapper...');

		// We enable the bluetooth client
		logIfEnabled(LogType.Debug, 'Enabling Bluetooth client...');
		this.bluetoothClient = new GnomeBluetooth.Client();

		// And create the indicator
		logIfEnabled(
			LogType.Debug,
			'Creating and adding Noiseclapper indicator...',
		);
		this.indicator = new NoiseclapperIndicator(this);
		Main.panel.addToStatusArea(this.uuid, this.indicator);

		// Apply settings and position
		this.settings = this.getSettings();
		this.settingsHandler = this.settings.connect(
			'changed',
			this.applySettings.bind(this),
		);
		this.applySettings();

		logIfEnabled(LogType.Info, 'Startup successful.');
	}

	disable() {
		logIfEnabled(LogType.Info, 'Disabling Noiseclapper...');

		// Disable Bluetooth client if enabled
		this.bluetoothClient = undefined;

		// Remove the indicator
		logIfEnabled(LogType.Debug, 'Removing Noiseclapper indicator...');
		this.indicator?.destroy();
		this.indicator = undefined;

		// Disconnect settings change handler
		if (this.settingsHandler !== undefined) {
			this.settings!.disconnect(this.settingsHandler);
			this.settingsHandler = undefined;
		}

		this.settings = undefined;
	}

	signalHandler(signal: string) {
		logIfEnabled(LogType.Debug, 'Preparing to send signal : [' + signal + ']');

		const devices = devicesObjectToArray(this.bluetoothClient!.get_devices());

		let hasFoundAtLeastOneDevice = false;
		for (const device of devices) {
			if (device.connected && supportedDeviceNames.includes(device.name!)) {
				hasFoundAtLeastOneDevice = true;

				const {name, address} = device;
				logIfEnabled(
					LogType.Info,
					`Sending signal [${signal}] to device [${name}] with MAC address [${address}]`,
				);
				void sendSignal(signal, address!);
			}
		}

		if (!hasFoundAtLeastOneDevice) {
			logIfEnabled(LogType.Error, 'No compatible devices found.');
			Main.notifyError(
				'Noiseclapper - ' + _('Error'),
				_('No connected compatible devices found.'),
			);
		}
	}

	applySettings() {
		logIfEnabled(LogType.Debug, 'Applying settings...');
		updateLogging(this.settings!.get_boolean('logging-enabled'));
		this.indicator!.applyPosition();
	}
}
