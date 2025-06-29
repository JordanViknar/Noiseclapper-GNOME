// ------------------------- Imports ----------------------------
// External
import St from "gi://St";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import GObject from "gi://GObject";
import GnomeBluetooth from "gi://GnomeBluetooth";
import type Gio from "gi://Gio";
import {
	LogType,
	devicesObjectToArray,
	equalizerPresetSignalList,
	logIfEnabled,
	noiseCancellingSignalList,
} from "./common.js";
// Internal
import type NoiseclapperExtension from "./extension.js";
import { Device, OpenSCQ30Client } from "./openSCQ30.js";
import { notify, notifyError } from "resource:///org/gnome/shell/ui/main.js";

const MODEL_NAMES: Record<string, string> = {
	"soundcore q20i": "SoundcoreA3004",
}

// ----------------------- Indicator -----------------------
export default GObject.registerClass(
	class NoiseclapperIndicator extends PanelMenu.Button {
		private readonly extension: NoiseclapperExtension;
		private readonly openSCQ30Client?: OpenSCQ30Client;
		private readonly bluetoothClient: GnomeBluetooth.Client;

		// TODO: Remove bluetooth client from this class dependancies
		constructor(extension: NoiseclapperExtension, bluetoothClient: GnomeBluetooth.Client, openSCQ30Client?: OpenSCQ30Client, ) {
			logIfEnabled(LogType.Debug, "Initializing Noiseclapper indicator...");

			super(0, extension.uuid);
			this.extension = extension;
			this.openSCQ30Client = openSCQ30Client;
			this.bluetoothClient = bluetoothClient;


			const box = new St.BoxLayout({
				vertical: false,
				styleClass: "panel-status-menu-box",
			});
			const icon = new St.Icon({
				iconName: "audio-headphones-symbolic",
				styleClass: "system-status-icon",
			});
			box.add_child(icon);
			this.add_child(box);

			// Settings button
			const settingsButton = new PopupMenu.PopupMenuItem(_("Settings"));
			settingsButton.connect("activate", () => {
				this.extension.openPreferences();
			});
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(settingsButton); // eslint-disable-line @typescript-eslint/no-unsafe-call

			if (this.openSCQ30Client) {
				this
					.addUnknownDevices()
					.then(() => this.openSCQ30Client!.getDevices())
					.then(devices => Promise.all(devices.map((device) => this.addDeviceOptions(device))))
					.catch(error => logIfEnabled(LogType.Error, `Failed to get devices: ${error}`));
			} else {
				this.addNoiseCancellingMenu()
				this.addEqualizerMenu()
			}

			// Separator
			// this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // eslint-disable-line @typescript-eslint/no-unsafe-call



			if (this.openSCQ30Client) {
				// @ts-expect-error for some reason there isn't this signal in type definitions even though it works

				this.menu.connect("open-state-changed", async (obj) => {
					if (!obj.isOpen) {
						return
					}

					const newDevices = await this.addUnknownDevices()
					if (newDevices.length === 0) {
						return
					}

					for (const device of newDevices) {
						this.addDeviceOptions(device)
					}
				})
			}

		}


		async addUnknownDevices(): Promise<Device[]> {
			const bluetoothDevices = devicesObjectToArray(
				this.bluetoothClient!.get_devices() as Gio.ListStore<GnomeBluetooth.Device>,
			);

			// TODO: Probably it's better to use something else instead of device name


			const dbDevices = await this.openSCQ30Client!.getDevices();
			const devicesToAdd: Device[] = bluetoothDevices
				.filter(bluetoothDevice => bluetoothDevice.connected)
				.map(bluetoothDevice => ({ mac: bluetoothDevice.address, model: MODEL_NAMES[bluetoothDevice.name.toLowerCase()] }))
				.filter(({ model }) => model !== undefined)
				.filter(bluetoothDevice => !dbDevices.find(dbDevice => dbDevice.mac === bluetoothDevice.mac))

			for (const bluetoothDevice of devicesToAdd) {
				await this.openSCQ30Client!.addNewDevice(bluetoothDevice.mac, bluetoothDevice.model);
			}

			return devicesToAdd;

		}

		async addDeviceOptions(device: Device) {
			const format = (battery: string) => `${(battery === "0" ? 0 : parseInt(battery) / 5) * 100}%`;
			const settings = await this.openSCQ30Client!.getSettings(device.mac);

			const batteryInfo = "batteryLevel" in settings 
				? `(${format(settings.batteryLevel)})`
				: `(${format(settings.batteryLevelRight)}, ${format(settings.batteryLevelLeft)}`

			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(`${device.model}${batteryInfo}`)); // eslint-disable-line @typescript-eslint/no-unsafe-call

		
			{
				const SETTING_NAME = "ambientSoundMode"
				const SETTING_VALUES = ["NoiseCanceling", "Transparency", "Normal"];

				const noiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(
					_("Noise Cancelling Mode"),
				);
				// @ts-expect-error addMenuItem no longer exists in the type definitions ?
				this.menu.addMenuItem(noiseCancellingModeMenu); // eslint-disable-line @typescript-eslint/no-unsafe-call

				const buttons: PopupMenu.PopupMenuItem[] = [];
				SETTING_VALUES.forEach(mode => {
					const button = new PopupMenu.PopupMenuItem(_(mode));

					button.setOrnament(PopupMenu.Ornament.NO_DOT);

					button.connect("activate", () => {
						buttons.forEach(btn => {
							btn.setOrnament(PopupMenu.Ornament.NO_DOT);
						});

						button.setOrnament(PopupMenu.Ornament.DOT);

						this.openSCQ30Client!.setSettingsValue(device.mac, SETTING_NAME, mode).catch(error => {
							logIfEnabled(LogType.Error, `Failed to set ${SETTING_NAME} for device ${device.mac}: ${error}`);
						});
					});

					noiseCancellingModeMenu.menu.addMenuItem(button);
					buttons.push(button);
				});

				this.openSCQ30Client!.getSettingsValue(device.mac, SETTING_NAME).then(currentValue => {
					buttons.forEach(button => {
						const buttonMode = SETTING_VALUES.find(mode => _(mode) === button.label.text);
						if (buttonMode === currentValue) {
							button.setOrnament(PopupMenu.Ornament.DOT);
						}
					});
				}).catch(error => {
					logIfEnabled(LogType.Error, `Failed to get ${SETTING_NAME} for device ${device.mac}: ${error}`);
				});
			}

			{
				const SETTING_NAME = "presetEqualizerProfile"
				const SETTING_VALUES = ["SoundcoreSignature", "Acoustic", "BassBooster", "BassReducer", "Classical", "Podcast", "Dance", "Deep", "Electronic", "Flat", "HipHop", "Jazz", "Latin", "Lounge", "Piano", "Pop", "RnB", "Rock", "SmallSpeakers", "SpokenWord", "TrebleBooster", "TrebleReducer"]

				const noiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(
					_("Equalizer Preset"),
				);
				// @ts-expect-error addMenuItem no longer exists in the type definitions ?
				this.menu.addMenuItem(noiseCancellingModeMenu); // eslint-disable-line @typescript-eslint/no-unsafe-call

				const buttons: PopupMenu.PopupMenuItem[] = [];
				SETTING_VALUES.forEach(mode => {
					const button = new PopupMenu.PopupMenuItem(_(mode));

					button.setOrnament(PopupMenu.Ornament.NO_DOT);

					button.connect("activate", () => {
						buttons.forEach(btn => {
							btn.setOrnament(PopupMenu.Ornament.NO_DOT);
						});

						button.setOrnament(PopupMenu.Ornament.DOT);

						this.openSCQ30Client!.setSettingsValue(device.mac, SETTING_NAME, mode).catch(error => {
							logIfEnabled(LogType.Error, `Failed to set ${SETTING_NAME} for device ${device.mac}: ${error}`);
						});
					});

					noiseCancellingModeMenu.menu.addMenuItem(button);
					buttons.push(button);
				});

				this.openSCQ30Client!.getSettingsValue(device.mac, SETTING_NAME).then(currentValue => {
					buttons.forEach(button => {
						const buttonMode = SETTING_VALUES.find(mode => _(mode) === button.label.text);
						if (buttonMode === currentValue) {
							button.setOrnament(PopupMenu.Ornament.DOT);
						}
					});
				}).catch(error => {
					logIfEnabled(LogType.Error, `Failed to get ${SETTING_NAME} for device ${device.mac}: ${error}`);
				});
			}


		}


		addEqualizerMenu() {
			// The 2 submenus
			const equalizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(
				_("Equalizer Preset"),
			);
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(equalizerPresetMenu); // eslint-disable-line @typescript-eslint/no-unsafe-call
			const equalizerPresetButtonList = [
				{
					label: `🎵 ${_("Soundcore Signature")}`,
					signal: equalizerPresetSignalList.signature,
				},
				{
					label: `🎸 ${_("Acoustic")}`,
					signal: equalizerPresetSignalList.acoustic,
				},
				{
					label: `🎸 ${_("Bass Booster")}`,
					signal: equalizerPresetSignalList.bassBooster,
				},
				{
					label: `🚫 ${_("Bass Reducer")}`,
					signal: equalizerPresetSignalList.bassReducer,
				},
				{
					label: `🎻 ${_("Classical")}`,
					signal: equalizerPresetSignalList.classical,
				},
				{
					label: `🎤 ${_("Podcast")}`,
					signal: equalizerPresetSignalList.podcast,
				},
				{ label: `🪩 ${_("Dance")}`, signal: equalizerPresetSignalList.dance },
				{ label: `🖴${_("Deep")}`, signal: equalizerPresetSignalList.deep },
				{
					label: `⚡ ${_("Electronic")}`,
					signal: equalizerPresetSignalList.electronic,
				},
				{ label: `🚫 ${_("Flat")}`, signal: equalizerPresetSignalList.flat },
				{
					label: `🎹 ${_("Hip-Hop")}`,
					signal: equalizerPresetSignalList.hipHop,
				},
				{ label: `🎷 ${_("Jazz")}`, signal: equalizerPresetSignalList.jazz },
				{
					label: `💃🏽 ${_("Latin")}`,
					signal: equalizerPresetSignalList.latin,
				},
				{
					label: `🍸 ${_("Lounge")}`,
					signal: equalizerPresetSignalList.lounge,
				},
				{ label: `🎹 ${_("Piano")}`, signal: equalizerPresetSignalList.piano },
				{ label: `🎸 ${_("Pop")}`, signal: equalizerPresetSignalList.pop },
				{ label: `🎹 ${_("RnB")}`, signal: equalizerPresetSignalList.rnB },
				{ label: `🎸 ${_("Rock")}`, signal: equalizerPresetSignalList.rock },
				{
					label: `🔉 ${_("Small Speaker(s)")}`,
					signal: equalizerPresetSignalList.smallSpeakers,
				},
				{
					label: `👄 ${_("Spoken Word")}`,
					signal: equalizerPresetSignalList.spokenWord,
				},
				{
					label: `🎼 ${_("Treble Booster")}`,
					signal: equalizerPresetSignalList.trebleBooster,
				},
				{
					label: `🚫 ${_("Treble Reducer")}`,
					signal: equalizerPresetSignalList.trebleReducer,
				},
			];
			this.addAllInListAsButtons(
				equalizerPresetButtonList,
				equalizerPresetMenu,
			);
		}

		addNoiseCancellingMenu() {
			const noiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(
				_("Noise Cancelling Mode"),
			);
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(noiseCancellingModeMenu); // eslint-disable-line @typescript-eslint/no-unsafe-call


			// The submenus' mode/preset lists
			const noiseCancellingModeButtonList = [
				{
					label: `🚋 ${_("Transport")}`,
					signal: noiseCancellingSignalList.transport,
				},
				{
					label: `🏠 ${_("Indoor")}`,
					signal: noiseCancellingSignalList.indoor,
				},
				{
					label: `🌳 ${_("Outdoor")}`,
					signal: noiseCancellingSignalList.outdoor,
				},
				{
					label: `🚫 ${_("Normal / No ANC")}`,
					signal: noiseCancellingSignalList.normal,
				},
				{
					label: `🪟 ${_("Transparency / No NC")}`,
					signal: noiseCancellingSignalList.transparency,
				},
			];
			this.addAllInListAsButtons(
				noiseCancellingModeButtonList,
				noiseCancellingModeMenu,
			);
		}

		addAllInListAsButtons(
			List: Array<{ label: string; signal: string }>,
			Submenu: PopupMenu.PopupSubMenuMenuItem,
		) {
			for (const element of List) {
				const button = new PopupMenu.PopupMenuItem(element.label);
				button.connect("activate", () => {
					this.extension.signalHandler(element.signal);
				});
				Submenu.menu.addMenuItem(button);
			}
		}

		// Lots of ugly bypasses, will have to fix later.
		applyPosition() {
			const boxes: {
				left: St.BoxLayout;
				center: St.BoxLayout;
				right: St.BoxLayout;
			} = {
				// @ts-expect-error Panel boxes do not exist in the type definitions.
				left: Main.panel._leftBox as St.BoxLayout,
				// @ts-expect-error Panel boxes do not exist in the type definitions.
				center: Main.panel._centerBox as St.BoxLayout,
				// @ts-expect-error Panel boxes do not exist in the type definitions.
				right: Main.panel._rightBox as St.BoxLayout,
			};
			const position = this.extension.settings!.get_int("position");
			const index = this.extension.settings!.get_int("position-number");

			Main.panel._addToPanelBox(
				this.extension.uuid,
				this,
				index,
				boxes[position === 0 ? "left" : position === 1 ? "center" : "right"],
			);
		}



		destroy() {
			super.destroy();
		}
	},
);
