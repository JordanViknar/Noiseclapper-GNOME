// ------------------------- Imports ----------------------------
// External
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
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
export default class NoiseclapperIndicator extends PanelMenu.Button {
	static {
		GObject.registerClass(NoiseclapperIndicator);
	}

	private readonly extension: NoiseclapperExtension;

	constructor(extension: NoiseclapperExtension) {
		logIfEnabled(LogType.Debug, "Initializing Noiseclapper indicator...");

		super(0, extension.uuid);
		this.extension = extension;

		const box = new St.BoxLayout({
			styleClass: "panel-status-menu-box",
		});
		const icon = new St.Icon({
			iconName: "audio-headphones-symbolic",
			styleClass: "system-status-icon",
		});
		box.add_child(icon);
		this.add_child(box);

		const menu = this.menu as PopupMenu.PopupMenu;

		// --- The 2 submenus ---
		// Noise Cancelling
		const noiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(
			_("Noise Cancelling Mode"),
		);
		noiseCancellingModeMenu.insert_child_at_index(
			this._createMenuIcon("audio-volume-muted-symbolic"),
			1,
		);
		menu.addMenuItem(noiseCancellingModeMenu);

		// Equalizer Preset
		const equalizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(
			_("Equalizer Preset"),
		);
		equalizerPresetMenu.insert_child_at_index(
			this._createMenuIcon("audio-card-symbolic"),
			1,
		);
		menu.addMenuItem(equalizerPresetMenu);

		// The submenus' mode/preset lists
		const noiseCancellingModeButtonList = [
			{
				label: _("Transport"),
				iconName: "airplane-mode-symbolic",
				signal: noiseCancellingSignalList.transport,
			},
			{
				label: _("Indoor"),
				iconName: "user-home-symbolic",
				signal: noiseCancellingSignalList.indoor,
			},
			{
				label: _("Outdoor"),
				iconName: "weather-few-clouds-symbolic",
				signal: noiseCancellingSignalList.outdoor,
			},
			{
				label: _("Normal / No ANC"),
				iconName: "audio-volume-high-symbolic",
				signal: noiseCancellingSignalList.normal,
			},
			{
				label: _("Transparency / No NC"),
				iconName: "audio-volume-overamplified-symbolic",
				signal: noiseCancellingSignalList.transparency,
			},
		];
		this.addAllInListAsButtons(
			noiseCancellingModeButtonList,
			noiseCancellingModeMenu,
		);
		const equalizerPresetButtonList = [
			{
				label: _("Soundcore Signature"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.signature,
			},
			{
				label: _("Acoustic"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.acoustic,
			},
			{
				label: _("Bass Booster"),
				iconName: "audio-volume-high-symbolic",
				signal: equalizerPresetSignalList.bassBooster,
			},
			{
				label: _("Bass Reducer"),
				iconName: "audio-volume-low-symbolic",
				signal: equalizerPresetSignalList.bassReducer,
			},
			{
				label: _("Classical"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.classical,
			},
			{
				label: _("Podcast"),
				iconName: "audio-input-microphone-symbolic",
				signal: equalizerPresetSignalList.podcast,
			},
			{
				label: _("Dance"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.dance,
			},
			{
				label: _("Deep"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.deep,
			},
			{
				label: _("Electronic"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.electronic,
			},
			{
				label: _("Flat"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.flat,
			},
			{
				label: _("Hip-Hop"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.hipHop,
			},
			{
				label: _("Jazz"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.jazz,
			},
			{
				label: _("Latin"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.latin,
			},
			{
				label: _("Lounge"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.lounge,
			},
			{
				label: _("Piano"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.piano,
			},
			{
				label: _("Pop"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.pop,
			},
			{
				label: _("RnB"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.rnB,
			},
			{
				label: _("Rock"),
				iconName: "audio-headphones-symbolic",
				signal: equalizerPresetSignalList.rock,
			},
			{
				label: _("Small Speaker(s)"),
				iconName: "audio-volume-low-symbolic",
				signal: equalizerPresetSignalList.smallSpeakers,
			},
			{
				label: _("Spoken Word"),
				iconName: "audio-input-microphone-symbolic",
				signal: equalizerPresetSignalList.spokenWord,
			},
			{
				label: _("Treble Booster"),
				iconName: "audio-volume-high-symbolic",
				signal: equalizerPresetSignalList.trebleBooster,
			},
			{
				label: _("Treble Reducer"),
				iconName: "audio-volume-medium-symbolic",
				signal: equalizerPresetSignalList.trebleReducer,
			},
		];
		this.addAllInListAsButtons(equalizerPresetButtonList, equalizerPresetMenu);

		// Separator
		menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		// Settings button
		const settingsButton = new PopupMenu.PopupMenuItem(_("Settings"));
		settingsButton.insert_child_at_index(
			this._createMenuIcon("preferences-system-symbolic"),
			1,
		);
		settingsButton.connect("activate", () => {
			this.extension.openPreferences();
		});
		menu.addMenuItem(settingsButton);
	}

	_createMenuIcon(iconName: string): St.Icon {
		const themeContext = St.ThemeContext.get_for_stage(global.stage);
		const iconSize = 16 * themeContext.scaleFactor;
		const icon = new St.Icon({
			gicon: Gio.ThemedIcon.new(iconName),
			styleClass: "system-status-icon",
			yExpand: false,
		});
		icon.set_size(iconSize, iconSize);
		return icon;
	}

	addAllInListAsButtons(
		List: Array<{ label: string; iconName: string; signal: string }>,
		Submenu: PopupMenu.PopupSubMenuMenuItem,
	) {
		for (const element of List) {
			const button = new PopupMenu.PopupMenuItem(element.label);
			// Icon
			const icon = this._createMenuIcon(element.iconName);
			button.insert_child_at_index(icon, 1);
			// Signal
			button.connect("activate", () => {
				this.extension.signalHandler(element.signal);
			});
			// Add to submenu
			Submenu.menu.addMenuItem(button);
		}
	}
}
