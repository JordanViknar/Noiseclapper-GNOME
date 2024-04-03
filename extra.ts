// Imports
import Gio from 'gi://Gio'
import GnomeBluetooth from 'gi://GnomeBluetooth'

//------------------------------Variables----------------------------
export const SupportedDeviceNames: string[] = [
	"Soundcore Life Q35",		//Not tested
	"Soundcore Life Q30",
	"Soundcore Life Q20+",		//Not tested
	"Soundcore Life Q20",		//Not tested
	"Soundcore Life Q10",		//Not tested, only partially compatible
	"BES_BLE"					//Buggy name sometimes applied to the Q30
]

// Preset lists
const NoiseCancellingSignalBase = "08ee00000006810e000"
export const NoiseCancellingSignalList = {
	transport: NoiseCancellingSignalBase+"00001008c",
	indoor: NoiseCancellingSignalBase+"00201008e",
	outdoor: NoiseCancellingSignalBase+"00101008d",
	//default = NoiseCancellingSignalBase+"00101008d",
	normal: NoiseCancellingSignalBase+"20101008f",
	transparency: NoiseCancellingSignalBase+"10101008e",
}

const EqualizerPresetSignalBase = "08ee00000002811400"
export const EqualizerPresetSignalList = {
	Signature: EqualizerPresetSignalBase+"000078787878787878784d",
	Acoustic: EqualizerPresetSignalBase+"0100a0828c8ca0a0a08c34",
	BassBooster: EqualizerPresetSignalBase+"0200a0968278787878789f",
	BassReducer: EqualizerPresetSignalBase+"0300505a6e787878787800",
	Classical: EqualizerPresetSignalBase+"040096966464788c96a0bf",
	Podcast: EqualizerPresetSignalBase+"05005a8ca0a0968c7864b6",
	Dance: EqualizerPresetSignalBase+"06008c5a6e828c8c825a5d",
	Deep: EqualizerPresetSignalBase+"07008c8296968c64504654",
	Electronic: EqualizerPresetSignalBase+"0800968c648c828c9696e1",
	Flat: EqualizerPresetSignalBase+"090064646e7878786464fc",
	HipHop: EqualizerPresetSignalBase+"0a008c966e6e8c6e8c96b1",
	Jazz: EqualizerPresetSignalBase+"0b008c8c6464788c96a0b2",
	Latin: EqualizerPresetSignalBase+"0c0078786464647896aa6d",
	Lounge: EqualizerPresetSignalBase+"0d006e8ca09678648c82b4",
	Piano: EqualizerPresetSignalBase+"0e007896968ca0aa96a04b",
	Pop: EqualizerPresetSignalBase+"0f006e829696826e645a66",
	RnB: EqualizerPresetSignalBase+"1000b48c64648c9696a0fd",
	Rock: EqualizerPresetSignalBase+"1100968c6e6e82969696e0",
	SmallSpeakers: EqualizerPresetSignalBase+"1200a0968278645a50502d",
	SpokenWord: EqualizerPresetSignalBase+"13005a64828c8c82785a4c",
	TrebleBooster: EqualizerPresetSignalBase+"14006464646e828c8ca075",
	TrebleReducer: EqualizerPresetSignalBase+"1500787878645a50503ca4"
}

//------------------------Util Functions------------------------
let LOGGING: boolean;
export enum LogType {
	Info,
	Warn,
	Error,
	Debug
}
export function logIfEnabled(type: LogType, message: string) {
    if (!LOGGING) return;

    let prefix = "[Noiseclapper] ";
    switch (type) {
        case LogType.Info:
            console.info(prefix + message);
            break;
        case LogType.Warn:
            console.warn(prefix + message);
            break;
        case LogType.Error:
            logError(prefix + message);
            break;
        case LogType.Debug:
            console.debug(prefix + message);
            break;
        default:
            console.log(prefix + message);
            break;
    }
}
export function updateLogging(enabled: boolean) {
	LOGGING = enabled;
}

//------------------------Bluetooth Functions------------------------
export function devicesObjectToArray(object: Gio.ListStore<GnomeBluetooth.Device>): (GnomeBluetooth.Device)[] {
    const numberOfDevices = object.get_n_items();
    const devices: (GnomeBluetooth.Device)[] = new Array(numberOfDevices);

    for (let i = 0; i < numberOfDevices; i++) {
        devices[i] = object.get_item(i) as GnomeBluetooth.Device;
    }

    return devices;
}

export async function sendSignal(signal: string, address: string) {
	try {
		const script = `import socket; s = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM); s.connect(("${address}", 12)); s.send(bytearray.fromhex("${signal}")); s.close();`;
		
		const proc = Gio.Subprocess.new(
			['python3', '-c', script]
			,
			Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
		)
		
		if (await proc.wait_check_async(null))
			logIfEnabled(LogType.Debug, 'Successfully sent signal');
		else
			logIfEnabled(LogType.Error, 'Failed to send signal');
	} catch (error) {
		logIfEnabled(LogType.Error, 'Failed to send signal : ' + error);
	}
}