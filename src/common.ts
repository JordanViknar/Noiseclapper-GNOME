// ------------------------ Imports ----------------------------
import Gio from 'gi://Gio';
import type GnomeBluetooth from 'gi://GnomeBluetooth';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {
	gettext as _,
	ngettext,
	pgettext,
} from 'resource:///org/gnome/shell/extensions/extension.js';

// ------------------------ Variables ----------------------------
export const supportedDeviceNames: string[] = [
	'Soundcore Life P3',
	'Soundcore Life Q35', // Not tested
	'Soundcore Life Q30',
	'Soundcore Life Q20+', // Not tested
	'Soundcore Life Q20', // Not tested
	'Soundcore Life Q10', // Not tested
	'BES_BLE', // Buggy name sometimes applied to the Q30
];

// Preset signal lists
const noiseCancellingSignalBase = '08ee00000006810e000';
export const noiseCancellingSignalList = {
	transport: noiseCancellingSignalBase + '00001008c',
	indoor: noiseCancellingSignalBase + '00201008e',
	outdoor: noiseCancellingSignalBase + '00101008d',
	// Placeholder : default = noiseCancellingSignalBase+'00101008d',
	normal: noiseCancellingSignalBase + '20101008f',
	transparency: noiseCancellingSignalBase + '10101008e',
};

const equalizerPresetSignalBase = '08ee00000002811400';
export const equalizerPresetSignalList = {
	signature: equalizerPresetSignalBase + '000078787878787878784d',
	acoustic: equalizerPresetSignalBase + '0100a0828c8ca0a0a08c34',
	bassBooster: equalizerPresetSignalBase + '0200a0968278787878789f',
	bassReducer: equalizerPresetSignalBase + '0300505a6e787878787800',
	classical: equalizerPresetSignalBase + '040096966464788c96a0bf',
	podcast: equalizerPresetSignalBase + '05005a8ca0a0968c7864b6',
	dance: equalizerPresetSignalBase + '06008c5a6e828c8c825a5d',
	deep: equalizerPresetSignalBase + '07008c8296968c64504654',
	electronic: equalizerPresetSignalBase + '0800968c648c828c9696e1',
	flat: equalizerPresetSignalBase + '090064646e7878786464fc',
	hipHop: equalizerPresetSignalBase + '0a008c966e6e8c6e8c96b1',
	jazz: equalizerPresetSignalBase + '0b008c8c6464788c96a0b2',
	latin: equalizerPresetSignalBase + '0c0078786464647896aa6d',
	lounge: equalizerPresetSignalBase + '0d006e8ca09678648c82b4',
	piano: equalizerPresetSignalBase + '0e007896968ca0aa96a04b',
	pop: equalizerPresetSignalBase + '0f006e829696826e645a66',
	rnB: equalizerPresetSignalBase + '1000b48c64648c9696a0fd',
	rock: equalizerPresetSignalBase + '1100968c6e6e82969696e0',
	smallSpeakers: equalizerPresetSignalBase + '1200a0968278645a50502d',
	spokenWord: equalizerPresetSignalBase + '13005a64828c8c82785a4c',
	trebleBooster: equalizerPresetSignalBase + '14006464646e828c8ca075',
	trebleReducer: equalizerPresetSignalBase + '1500787878645a50503ca4',
};

// ------------------------ Logging ------------------------
let logging: boolean;
export enum LogType {
	Info,
	Warn,
	Error,
	Debug,
}
export function logIfEnabled(type: LogType, message: string) {
	if (!logging) return;

	const prefix = '[Noiseclapper] ';
	switch (type) {
		case LogType.Info: {
			console.info(prefix + message);
			break;
		}

		case LogType.Warn: {
			console.warn(prefix + message);
			break;
		}

		case LogType.Error: {
			logError(prefix + message);
			break;
		}

		case LogType.Debug: {
			console.debug(prefix + message);
			break;
		}
	}
}

export function updateLogging(enabled: boolean) {
	logging = enabled;
}

// ------------------------ Bluetooth ------------------------
export function devicesObjectToArray(
	object: Gio.ListStore<GnomeBluetooth.Device>,
): GnomeBluetooth.Device[] {
	const numberOfDevices = object.get_n_items();

	return Array.from(
		{length: numberOfDevices},
		(_, i) => object.get_item(i) as GnomeBluetooth.Device,
	);
}

export async function sendSignal(signal: string, address: string) {
	try {
		// Absolutely necessary to use Python, haven't found a way to send the signals through GJS
		const script = `import socket; s = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM); s.connect(('${address}', 12)); s.send(bytearray.fromhex('${signal}')); s.close();`;

		const process = Gio.Subprocess.new(
			['python3', '-c', script],
			// eslint-disable-next-line no-bitwise
			Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
		);

		await process.wait_check_async(null);
		logIfEnabled(LogType.Debug, 'Successfully sent signal');
	} catch (error) {
		if (error instanceof Error) {
			logIfEnabled(LogType.Error, 'Failed to send signal : ' + error.message);
		}

		Main.notifyError(
			'Noiseclapper - ' + _('Error'),
			_('Close the Soundcore application on your phone and try again.'),
		);
	}
}
