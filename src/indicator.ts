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
import { LogType, logIfEnabled } from "./common.js";
// Internal
import type NoiseclapperExtension from "./extension.js";
import {
	Device,
	OpenSCQ30Client,
	PythonClient,
	SoundcoreClient,
} from "./clients.js";
import { notify, notifyError } from "resource:///org/gnome/shell/ui/main.js";

// ----------------------- Indicator -----------------------
export default GObject.registerClass(
	class NoiseclapperIndicator extends PanelMenu.Button {
		private readonly extension: NoiseclapperExtension;
		private readonly openSCQ30Client?: OpenSCQ30Client;
		private readonly pythonClient: PythonClient = new PythonClient();

		private readonly bluetoothClient: GnomeBluetooth.Client;

		// TODO: Remove bluetooth client from this class dependancies
		constructor(
			extension: NoiseclapperExtension,
			bluetoothClient: GnomeBluetooth.Client,
			openSCQ30Client?: OpenSCQ30Client,
		) {
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

			this.bluetoothClient.connect("device-added", async (obj, d) => {
				const device = d as GnomeBluetooth.Device;

				if (
					(await this.pythonClient.isWorking()) &&
					(await this.pythonClient.isModelSupported(device.name))
				) {
					await this.addDeviceOptions({
						mac: device.address,
						model: device.name,
					});

					return
				}

				if (this.openSCQ30Client && await this.openSCQ30Client.isModelSupported(device.name)) {
					const dbDevices = await this.openSCQ30Client!.getDevices();

					if (!dbDevices.find((dbDevice) => dbDevice.mac === device.address)) {
						await this.openSCQ30Client?.addNewDevice(
							device.address,
							device.name,
						);
					}

					await this.addDeviceOptions({
						mac: device.address,
						model: device.name,
					});
				}
			});
			this.bluetoothClient.connect("device-removed", (obj, d) => {
				// TODO
			})

			this.init().then(() => this.addSettings());
		}

		async init() {
			if (!this.openSCQ30Client && !(await this.pythonClient.isWorking())) {
				this.addMenuInfo(_("Please install python or OpenSCQ30 CLI"));
				return;
			}

			const bluetoothDevices = await this.getConnectedSoundcoreDevices();
			if (bluetoothDevices.length === 0) {
				this.addMenuInfo(_("No devices found"));

				return;
			}

			if (this.openSCQ30Client) {
				const dbDevices = await this.openSCQ30Client!.getDevices();
				const bluetoothDevicesThatAreNotInDb = bluetoothDevices.filter(
					(bluetoothDevice) =>
						!dbDevices.find((dbDevice) => dbDevice.mac === bluetoothDevice.mac),
				);

				bluetoothDevicesThatAreNotInDb.forEach((device) =>
					this.openSCQ30Client?.addNewDevice(device.mac, device.model),
				);
			}

			for (const device of bluetoothDevices) {
				await this.addDeviceOptions(device);
			}
		}

		addSettings() {
			this.addToMenu(new PopupMenu.PopupSeparatorMenuItem());

			// Settings button
			const settingsButton = new PopupMenu.PopupMenuItem(_("Settings"));
			settingsButton.connect("activate", () => {
				this.extension.openPreferences();
			});

			this.addToMenu(settingsButton);
		}

		getBluetoothDevices(): GnomeBluetooth.Device[] {
			const devices =
				this.bluetoothClient!.get_devices() as Gio.ListStore<GnomeBluetooth.Device>;
			const numberOfDevices = devices.get_n_items();

			return Array.from(
				{ length: numberOfDevices },
				(_, i) => devices.get_item(i) as GnomeBluetooth.Device,
			);
		}

		async isConnectedSoundcore(device: GnomeBluetooth.Device) {
			if (!device.connected) {
				return false;
			}

			if (await this.pythonClient.isModelSupported(device.name)) {
				return true;
			}

			if (this.openSCQ30Client) {
				return await this.openSCQ30Client.isModelSupported(device.name);
			}

			return false;
		}

		async getConnectedSoundcoreDevices(): Promise<Device[]> {
			const bluetoothDevices = this.getBluetoothDevices();

			const devices = bluetoothDevices.map(async (bluetoothDevice) => {
				const device = {
					mac: bluetoothDevice.address,
					model: bluetoothDevice.name,
				};

				return {
					...device,
					supported: await this.isConnectedSoundcore(bluetoothDevice),
				};
			});

			return Promise.all(devices).then((devices) =>
				devices.filter(({ supported }) => supported),
			);
		}

		async addSelectSettings(settings: {
			title: string;
			values: Record<string, string>;
			selectedId: string;
			onSelect: (a: string) => void;
		}) {
			const submenu = new PopupMenu.PopupSubMenuMenuItem(settings.title);
			this.addToMenu(submenu);

			const buttons: PopupMenu.PopupMenuItem[] = [];

			for (const [id, label] of Object.entries(settings.values)) {
				const button = new PopupMenu.PopupMenuItem(label);

				button.setOrnament(
					settings.selectedId === id
						? PopupMenu.Ornament.DOT
						: PopupMenu.Ornament.NO_DOT,
				);

				button.connect("activate", () => {
					buttons.forEach((btn) => {
						btn.setOrnament(PopupMenu.Ornament.NO_DOT);
					});

					button.setOrnament(PopupMenu.Ornament.DOT);

					settings.onSelect(id);
				});

				submenu.menu.addMenuItem(button);
				buttons.push(button);
			}
		}

		async addDeviceTitle(device: Device) {
			let batteryInfo = "";

			if (this.openSCQ30Client) {
				const formatBatteryLevel = (battery: string) =>
					`${(battery === "0" ? 0 : parseInt(battery) / 5) * 100}%`;
				const formatChargingStatus = (status: string) =>
					status === "true" ? "↑" : "";

				const settings = await this.openSCQ30Client!.getAvailableSettings(
					device.mac,
				);

				if (settings.includes("batteryLevel")) {
					const batteryLevel = await this.openSCQ30Client!.getSettingsValue(
						device.mac,
						"batteryLevel",
					).then(formatBatteryLevel);
					const chargingStatus = await this.openSCQ30Client!.getSettingsValue(
						device.mac,
						"isCharging",
					).then(formatChargingStatus);

					batteryInfo = `(${batteryLevel}${chargingStatus})`;
				}

				if (
					settings.includes("batteryLevelLeft") &&
					settings.includes("batteryLevelRight")
				) {
					const batteryLevelLeft = await this.openSCQ30Client!.getSettingsValue(
						device.mac,
						"batteryLevelLeft",
					).then(formatBatteryLevel);
					const chargingStatusLeft =
						await this.openSCQ30Client!.getSettingsValue(
							device.mac,
							"isChargingLeft",
						).then(formatChargingStatus);
					const batteryLevelRight =
						await this.openSCQ30Client!.getSettingsValue(
							device.mac,
							"batteryLevelRight",
						).then(formatBatteryLevel);
					const chargingStatusRight =
						await this.openSCQ30Client!.getSettingsValue(
							device.mac,
							"isChargingRight",
						).then(formatChargingStatus);

					batteryInfo = `(${batteryLevelLeft}${chargingStatusLeft}, ${batteryLevelRight}${chargingStatusRight})`;
				}
			}

			const separator = new PopupMenu.PopupSeparatorMenuItem(
				`${device.model}${batteryInfo}`,
			);
			this.addToMenu(separator);
		}

		async addDeviceOptions(device: Device) {
			await this.addDeviceTitle(device);

			const client = this.openSCQ30Client ?? this.pythonClient;
			await this.addSelectSettings({
				title: _("Equalizer Preset"),
				values: {
					SoundcoreSignature: `🎵 ${_("Soundcore Signature")}`,
					Acoustic: `🎸 ${_("Acoustic")}`,
					BassBooster: `🎸 ${_("Bass Booster")}`,
					BassReducer: `🚫 ${_("Bass Reducer")}`,
					Classical: `🎻 ${_("Classical")}`,
					Podcast: `🎤 ${_("Podcast")}`,
					Dance: `🪩 ${_("Dance")}`,
					Deep: `🖴${_("Deep")}`,
					Electronic: `⚡ ${_("Electronic")}`,
					Flat: `🚫 ${_("Flat")}`,
					HipHop: `🎹 ${_("Hip-Hop")}`,
					Jazz: `🎷 ${_("Jazz")}`,
					Latin: `💃🏽 ${_("Latin")}`,
					Lounge: `🍸 ${_("Lounge")}`,
					Piano: `🎹 ${_("Piano")}`,
					Pop: `🎸 ${_("Pop")}`,
					RnB: `🎹 ${_("RnB")}`,
					Rock: `🎸 ${_("Rock")}`,
					SmallSpeakers: `🔉 ${_("Small Speaker(s)")}`,
					SpokenWord: `👄 ${_("Spoken Word")}`,
					TrebleBooster: `🎼 ${_("Treble Booster")}`,
					TrebleReducer: `🚫 ${_("Treble Reducer")}`,
				},
				selectedId: "SoundcoreSignature",
				onSelect: (value) =>
					client.setSettingsValue(device.mac, "presetEqualizerProfile", value),
			});

			// Only show IFF
			// * there is working python client
			// * it supports the model

			// This is messy
			if (
				(await this.pythonClient.isWorking()) &&
				(await this.pythonClient.isModelSupported(device.model))
			) {
				// I can't figure out where is this settings in openscq30

				await this.addSelectSettings({
					title: _("Noise Cancelling Mode"),
					values: {
						Transport: `🚋 ${_("Transport")}`,
						Indoor: `🏠 ${_("Indoor")}`,
						Outdoor: `🌳 ${_("Outdoor")}`,
						Normal: `🚫 ${_("Normal / No ANC")}`,
						Transparency: `🪟 ${_("Transparency / No NC")}`,
					},
					selectedId: "Transport",
					onSelect: (value) =>
						this.pythonClient.setSettingsValue(
							device.mac,
							"noiseCancellingMode",
							value,
						),
				});

				return;
			}

			if (!this.openSCQ30Client) {
				return;
			}
			const settings = await this.openSCQ30Client.getSettings(device.mac);

			if ("ambientSoundMode" in settings) {
				await this.addSelectSettings({
					title: _("Ambient Sound Mode"),
					values: {
						// TODO: This is wrong for models that dont's have all 3 modes
						// We should probably fetch available settings from CLI
						NoiseCanceling: `🤫 ${_("Noise canceling")}`,
						Transparency: `👂 ${_("Transparency")}`,
						Normal: `🎧 ${_("Normal")}`,
					},
					selectedId: settings.ambientSoundMode,
					onSelect: (value) =>
						this.openSCQ30Client?.setSettingsValue(
							device.mac,
							"ambientSoundMode",
							value,
						),
				});
			}

			if ("windNoiseSuppression" in settings) {
				// This looks weird
				await this.addToggleSettings({
					title: _("Wind Noise Suppression"),
					active: settings.ambientSoundMode === "true",
					onActive: (value) =>
						this.openSCQ30Client!.setSettingsValue(
							device.mac,
							"windNoiseSuppression",
							value ? "true" : "false",
						),
				});
			}

			if ("transparencyMode" in settings) {
				await this.addSelectSettings({
					title: _("Transparency Mode"),
					values: {
						FullyTransparent: `🌐 ${_("Fully Transparent")}`,
						VocalMode: `🎤 ${_("Vocal Mode")}`,
					},
					selectedId: settings.transparencyMode,
					onSelect: (value) =>
						this.openSCQ30Client?.setSettingsValue(
							device.mac,
							"transparencyMode",
							value,
						),
				});
			}
		}

		addToggleSettings(settings: {
			title: string;
			active: boolean;
			onActive: (value: boolean) => void;
		}) {
			const toggle = new PopupMenu.PopupSwitchMenuItem(
				settings.title,
				settings.active,
			);

			toggle.connect("toggled", (obj) => settings.onActive(obj.active));

			this.addToMenu(toggle);
		}

		addMenuInfo(label: string) {
			this.addToMenu(
				new PopupMenu.PopupMenuItem(label, {
					activate: false,
					reactive: false,
				}),
			);
		}

		addToMenu(item: PopupMenu.PopupBaseMenuItem) {
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(item); // eslint-disable-line @typescript-eslint/no-unsafe-call
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
