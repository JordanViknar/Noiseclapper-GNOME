import Gio from "gi://Gio";
import { logIfEnabled, LogType } from "./common.js";
import { notifyError } from "resource:///org/gnome/shell/ui/main.js";

export interface Device {
	model: string;
	mac: string;
}

export abstract class SoundcoreClient {
	public abstract getVersion(): Promise<string>;
	public abstract isModelSupported(model: string): Promise<boolean>;
	public abstract setSettingsValue(
		mac: string,
		name: string,
		value: string,
	): Promise<void>;

	public async processCommand(args: string[]): Promise<string> {
		const proc = Gio.Subprocess.new(
			args,
			// eslint-disable-next-line no-bitwise
			Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
		);

		return new Promise((resolve, reject) => {
			proc.communicate_utf8_async(null, null, (proc, result) => {
				try {
					if (!proc) {
						reject(new Error("Process is null"));
						return;
					}

					const [success, stdout, stderr] =
						proc.communicate_utf8_finish(result);
					if (success) {
						resolve(stdout);
					} else {
						reject(new Error(`Command failed: ${stderr}`));
					}
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	public async isWorking(): Promise<boolean> {
		try {
			await this.getVersion();
			return true;
		} catch (error) {
			return false;
		}
	}
}

export class OpenSCQ30Client extends SoundcoreClient {
	// https://github.com/gmallios/SoundcoreManager/blob/131ac405a1a372c689e6952e3b1b11f89ba4e54d/manager-ui/src/assets/productNames.json#L2
	static readonly POSSIBLE_MODEL_NAMES: Record<string, string> = {
		A3004: "soundcore Q20i",
		A3025: "Soundcore Life Q20+",
		A3027: "Soundcore Life Q35",
		A3028: "Soundcore Life Q30",
		A3029: "Soundcore Life Tune",
		A3030: "Soundcore Life Tune Pro",
		A3033: "Soundcore Life 2 Neo",
		A3040: "Soundcore Space Q45",
		A3116: "Soundcore Motion+",
		A3117: "Soundcore 3",
		A3118: "Soundcore Motion Boom",
		A3119: "Soundcore Mini 3",
		A3123: "Soundcore Icon+",
		A3125: "Soundcore Select 2",
		A3126: "Soundcore Select Pro",
		A3127: "Soundcore Mini 3 Pro",
		A3129: "Soundcore Motion Boom Plus",
		A3130: "soundcore Motion X600",
		A3145: "Anker Soundcore Boost",
		A3161: "Soundcore Flare",
		A3162: "Soundcore Flare +",
		A3163: "Soundcore Flare S+",
		A3165: "Soundcore Flare 2",
		A3167: "Soundcore Flare Mini",
		A3201: "Soundcore Life NC",
		A3300: "Soundcore Wakey",
		A3301: "Anker PowerConf",
		A3302: "Anker PowerConf S3",
		A3372: "Soundcore Infini Pro",
		A3390: "Soundcore Rave mini",
		A3391: "Soundcore Rave",
		A3392: "Soundcore Mega",
		A3393: "Soundcore Trance",
		A3395: "Soundcore Rave Neo",
		A3396: "Soundcore Trance Go",
		A3398: "Soundcore R30",
		A3399: "Soundcore Rave Party 2",
		A3600: "Soundcore Frames",
		A3850: "Soundcore VR P10",
		A3909: "Soundcore Liberty 2 Pro",
		A3910: "Soundcore Liberty Air 2",
		A3913: "Soundcore Liberty 2",
		A3926: "Soundcore Liberty Neo 2",
		A3927: "Soundcore Life A1",
		A3930: "Soundcore Liberty 2 Pro+",
		A3931: "Soundcore Life Dot 2 NC",
		A3933: "Soundcore Life Note 3",
		A3935: "Soundcore Life A2 NC",
		A3936: "Soundcore Space A40",
		A3939: "Soundcore Life P3",
		A3943: "soundcore Life Note C",
		A3944: "soundcore Life P2 Mini",
		A3945: "Soundcore Life Note 3S",
		A3947: "soundcore Liberty 4 NC",
		A3948: "soundcore A20i",
		A3949: "soundcore P20i",
		A3951: "Soundcore Liberty Air 2 Pro",
		A3952: "Soundcore Liberty 3 Pro",
		A3953: "Soundcore Liberty 4",
		A3961: "Soundcore Sport X10",
		A3982: "Soundcore Life Dot 3i",
		A3983: "Soundcore Life Note 3i",
		A3992: "Soundcore Life A3i",
		A3993: "Soundcore Life P3i",
		A6610: "Soundcore Sleep A10",
	};

	static readonly SUPPORTED_MODELS = [
		"A3004",
		"A3027",
		"A3028",
		"A3029",
		"A3030",
		"A3031",
		"A3033",
		"A3926",
		"A3930",
		"A3931",
		"A3933",
		"A3936",
		"A3945",
		"A3951",
		"A3939",
		"A3935",
		"A3959",
	];

	constructor(private path: string) {
		super();
	}

	private runOpenSCQ30(args: string[]) {
		return this.processCommand([this.path, ...args]);
	}

	public async getDevices(): Promise<Device[]> {
		const stdout = await this.runOpenSCQ30(["paired-devices", "list"]);

		return stdout
			.trim()
			.split("\n")
			.slice(3)
			.filter((line) => !line.startsWith("+"))
			.map((line) =>
				line
					.split("|")
					.map((field) => field.trim())
					.slice(1),
			)
			.map(([model, mac]) => ({
				model:
					OpenSCQ30Client.POSSIBLE_MODEL_NAMES[model.slice("Soundcore".length)],
				mac,
			}));
	}

	// All of this just to parse a table
	public async getSettingsValue(mac: string, name: string): Promise<string> {
		const stdout = await this.runOpenSCQ30([
			"device",
			"exec",
			"--get",
			name,
			"--mac-address",
			mac,
		]);

		return stdout
			.trim()
			.split("\n")
			.slice(3)
			.filter((line) => !line.startsWith("+"))
			.map((line) =>
				line
					.split("|")
					.map((field) => field.trim())
					.slice(1),
			)
			.map(([key, value]) => value)[0];
	}

	public async setSettingsValue(
		mac: string,
		name: string,
		value: string,
	): Promise<void> {
		await this.runOpenSCQ30([
			"device",
			"exec",
			"--set",
			`${name}=${value}`,
			"--mac-address",
			mac,
		]);
	}

	public async getAvailableSettings(mac: string): Promise<string[]> {
		const stdout = await this.runOpenSCQ30([
			"device",
			"list-settings",
			"--no-headers",
			"--no-extended-info",
			"--mac-address",
			mac,
		]);

		return stdout.trim().split("\n");
	}

	public async addNewDevice(mac: string, model: string): Promise<void> {
		const entry = Object.entries(OpenSCQ30Client.POSSIBLE_MODEL_NAMES).find(
			([serial, m]) => m.toLowerCase() === model.toLowerCase(),
		);

		if (entry === undefined) {
			notifyError(`Model ${model} was not found`);
			return;
		}

		const openscq30ModelName = `Soundcore${entry[0]}`;

		await this.runOpenSCQ30([
			"paired-devices",
			"add",
			"--mac-address",
			mac,
			"--model",
			openscq30ModelName,
		]);
	}

	public async getVersion() {
		return await this.runOpenSCQ30(["--version"]);
	}

	public async getSettings(mac: string): Promise<Record<string, string>> {
		const availableSettings = await this.getAvailableSettings(mac);
		const settings: Record<string, string> = {};

		for (const setting of availableSettings) {
			settings[setting] = await this.getSettingsValue(mac, setting);
		}

		return settings;
	}

	public async isModelSupported(model: string): Promise<boolean> {
		const entry = Object.entries(OpenSCQ30Client.POSSIBLE_MODEL_NAMES).find(
			([serial, m]) => m === model,
		);

		if (!entry) {
			return false;
		}

		return OpenSCQ30Client.SUPPORTED_MODELS.includes(entry[0]);
	}
}

export class PythonClient extends SoundcoreClient {
	static readonly SUPPORTED_MODELS: string[] = [
		"Soundcore Life P3", // (A3939)
		"Soundcore Life Q35", // (A3027) Not tested
		"Soundcore Life Q30", // (A3028)
		"Soundcore Life Q20+", // (A3025) Not tested
		"Soundcore Life Q20", // (???) Not tested
		"Soundcore Life Q10", // (???) Not tested
		"BES_BLE", // Buggy name sometimes applied to the Q30
	];

	static readonly SIGNAL_NOISE_CANCELLING_COMMAND = "08ee00000006810e000";
	static readonly SIGNAL_NOISE_CANCELLING_VALUES: Record<string, string> = {
		Transport: "00001008c",
		Indoor: `00201008e`,
		Outdoor: `00101008d`,
		Normal: `20101008f`,
		Transparency: `10101008e`,
	};
	static readonly SIGNAL_EQUALIZER_PRESET_COMMAND = "08ee00000002811400";
	static readonly SIGNAL_EQUALIZER_PRESENT_VALUES: Record<string, string> = {
		SoundcoreSignature: `000078787878787878784d`,
		Acoustic: `0100a0828c8ca0a0a08c34`,
		BassBooster: `0200a0968278787878789f`,
		BassReducer: `0300505a6e787878787800`,
		Classical: `040096966464788c96a0bf`,
		Podcast: `05005a8ca0a0968c7864b6`,
		Dance: `06008c5a6e828c8c825a5d`,
		Deep: `07008c8296968c64504654`,
		Electronic: `0800968c648c828c9696e1`,
		Flat: `090064646e7878786464fc`,
		HipHop: `0a008c966e6e8c6e8c96b1`,
		Jazz: `0b008c8c6464788c96a0b2`,
		Latin: `0c0078786464647896aa6d`,
		Lounge: `0d006e8ca09678648c82b4`,
		Piano: `0e007896968ca0aa96a04b`,
		Pop: `0f006e829696826e645a66`,
		RnB: `1000b48c64648c9696a0fd`,
		Rock: `1100968c6e6e82969696e0`,
		SmallSpeakers: `1200a0968278645a50502d`,
		SpokenWord: `13005a64828c8c82785a4c`,
		TrebleBooster: `14006464646e828c8ca075`,
		TrebleReducer: `1500787878645a50503ca4`,
	};

	// TODO: The path should probably be configurable
	constructor(private path: string = "python") {
		super();
	}

	public async isModelSupported(model: string): Promise<boolean> {
		return PythonClient.SUPPORTED_MODELS.map((model) =>
			model.toLowerCase(),
		).includes(model.toLowerCase());
	}

	private async runPython(args: string[]): Promise<string> {
		return this.processCommand([this.path, ...args]);
	}

	private getSignal(settings: string, value: string) {
		if (settings === "noiseCancellingMode") {
			if (!(value in PythonClient.SIGNAL_NOISE_CANCELLING_VALUES)) {
				throw new Error("Unknown noise cancelling setting");
			}

			return (
				PythonClient.SIGNAL_NOISE_CANCELLING_COMMAND +
				PythonClient.SIGNAL_NOISE_CANCELLING_VALUES[value]
			);
		}

		if (settings === "presetEqualizerProfile") {
			if (!(value in PythonClient.SIGNAL_EQUALIZER_PRESENT_VALUES)) {
				throw new Error("Unknown equalizer settings");
			}
			return (
				PythonClient.SIGNAL_EQUALIZER_PRESET_COMMAND +
				PythonClient.SIGNAL_EQUALIZER_PRESENT_VALUES[value]
			);
		}

		throw new Error("Unknown settings");
	}

	public async setSettingsValue(
		mac: string,
		name: string,
		value: string,
	): Promise<void> {
		const signal = this.getSignal(name, value);

		const script = `import socket; s = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM); s.connect(('${mac}', 12)); s.send(bytearray.fromhex('${signal}')); s.close();`;
		const result = await this.runPython(["-c", script]);
	}

	public getVersion(): Promise<string> {
		return this.runPython(["--version"]);
	}
}
