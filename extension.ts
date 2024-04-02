//------------------------------Libraries----------------------------
// External imports
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// Internal imports
import NoiseclapperIndicator from './indicator.js';
import {LogType, logIfEnabled} from './general.js';
import GnomeBluetooth from 'gi://GnomeBluetooth'

// ----------------------- Extension -----------------------
export default class NoiseclapperExtension extends Extension {
	private BluetoothClient?: GnomeBluetooth.Client;
	private Indicator?: InstanceType<typeof NoiseclapperIndicator>;

	enable() {
		logIfEnabled(LogType.Info,"Enabling Noiseclapper...");

		// We enable the bluetooth client
		logIfEnabled(LogType.Debug,"Enabling Bluetooth client...");
		this.BluetoothClient = new GnomeBluetooth.Client();

		// And create the indicator
		logIfEnabled(LogType.Debug,"Creating and adding Noiseclapper indicator...");
		this.Indicator = new NoiseclapperIndicator(this);
		Main.panel.addToStatusArea('NoiseclapperIndicator', this.Indicator);
		// this.Indicator.applyPosition()
	}
	disable() {
		logIfEnabled(LogType.Info,"Disabling Noiseclapper...");
		
		//Disable Bluetooth client if enabled
		if (this.BluetoothClient != undefined) {this.BluetoothClient = undefined;}

		//Remove the indicator
		logIfEnabled(LogType.Debug,"Removing Noiseclapper indicator...");
		this.Indicator?.destroy();
		this.Indicator = undefined;
	}
}