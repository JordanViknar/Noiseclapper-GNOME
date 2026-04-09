import GObject from "gi://GObject";
// ------------------------- Imports ----------------------------
// External
import St from "gi://St";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import {
	equalizerPresetSignalList,
	LogType,
	logIfEnabled,
	noiseCancellingSignalList,
} from "./common.js";
// Internal
import type NoiseclapperExtension from "./extension.js";

// ----------------------- Indicator -----------------------
export default GObject.registerClass(
	class NoiseclapperIndicator extends PanelMenu.Button {
		private readonly extension: NoiseclapperExtension;

		constructor(extension: NoiseclapperExtension) {
			logIfEnabled(LogType.Debug, "Initializing Noiseclapper indicator...");

			super(0, extension.uuid);
			this.extension = extension;

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

			// The 2 submenus
			const noiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(
				_("Noise Cancelling Mode"),
			);
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(noiseCancellingModeMenu); // eslint-disable-line @typescript-eslint/no-unsafe-call
			const equalizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(
				_("Equalizer Preset"),
			);
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(equalizerPresetMenu); // eslint-disable-line @typescript-eslint/no-unsafe-call

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

			// Separator
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // eslint-disable-line @typescript-eslint/no-unsafe-call

			// Settings button
			const settingsButton = new PopupMenu.PopupMenuItem(_("Settings"));
			settingsButton.connect("activate", () => {
				this.extension.openPreferences();
			});
			// @ts-expect-error addMenuItem no longer exists in the type definitions ?
			this.menu.addMenuItem(settingsButton); // eslint-disable-line @typescript-eslint/no-unsafe-call
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
