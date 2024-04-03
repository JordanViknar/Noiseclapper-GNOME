// External Imports
import St from 'gi://St'
import GObject from 'gi://GObject'
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

// Internal Imports
import NoiseclapperExtension from './extension.js';
import {LogType, logIfEnabled, NoiseCancellingSignalList, EqualizerPresetSignalList} from './utilities.js';

export default GObject.registerClass(
	class NoiseclapperIndicator extends PanelMenu.Button {
		private extension: NoiseclapperExtension;
	
		constructor(extension: NoiseclapperExtension) {
			logIfEnabled(LogType.Debug,"Initializing Noiseclapper indicator...");
	
			super(0, extension.uuid)
			this.extension = extension
			
			const box = new St.BoxLayout({ vertical: false, styleClass: 'panel-status-menu-box' });
			const icon = new St.Icon({ iconName: 'audio-headphones-symbolic', styleClass: 'system-status-icon' });
			box.add_child(icon);
			this.add_child(box);

			//The 2 submenus
			let NoiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(_('Noise Cancelling Mode'));
			this.menu.addMenuItem(NoiseCancellingModeMenu);
			let EqualizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(_('Equalizer Preset'));
			this.menu.addMenuItem(EqualizerPresetMenu);

			//The submenus' mode/preset lists
			const NoiseCancellingModeButtonList = [
				{ label: '🚋 '+_('Transport'), signal: NoiseCancellingSignalList.transport},
				{ label: '🏠 '+_('Indoor'), signal: NoiseCancellingSignalList.indoor },
				{ label: '🌳 '+_('Outdoor'), signal: NoiseCancellingSignalList.outdoor },
			  //{ label: '🔇 '+_('Default'), signal: NoiseCancellingSignalList.default }, //Not really necessary, probably better to keep it as a comment.
				{ label: '🚫 '+_('Normal / No ANC'), signal: NoiseCancellingSignalList.normal },
				{ label: '🪟 '+_('Transparency / No NC'), signal: NoiseCancellingSignalList.transparency },
			];
			this.addAllInListAsButtons(NoiseCancellingModeButtonList, NoiseCancellingModeMenu);
			const EqualizerPresetButtonList = [
				{ label: '🎵 '+_('Soundcore Signature'), signal: EqualizerPresetSignalList.Signature },
				{ label: '🎸 '+_('Acoustic'), signal: EqualizerPresetSignalList.Acoustic },
				{ label: '🎸 '+_('Bass Booster'), signal: EqualizerPresetSignalList.BassBooster },
				{ label: '🚫 '+_('Bass Reducer'), signal: EqualizerPresetSignalList.BassReducer },
				{ label: '🎻 '+_('Classical'), signal:	EqualizerPresetSignalList.Classical },
				{ label: '🎤 '+_('Podcast'), signal: EqualizerPresetSignalList.Podcast },
				{ label: '🪩 '+_('Dance'), signal: EqualizerPresetSignalList.Dance },
				{ label: '🖴' +_('Deep'), signal: EqualizerPresetSignalList.Deep },
				{ label: '⚡ '+_('Electronic'), signal:	EqualizerPresetSignalList.Electronic },
				{ label: '🚫 '+_('Flat'), signal: EqualizerPresetSignalList.Flat },
				{ label: '🎹 '+_('Hip-Hop'), signal: EqualizerPresetSignalList.HipHop },
				{ label: '🎷 '+_('Jazz'), signal: EqualizerPresetSignalList.Jazz },
				{ label: '💃🏽 '+_('Latin'), signal: EqualizerPresetSignalList.Latin },
				{ label: '🍸 '+_('Lounge'), signal: EqualizerPresetSignalList.Lounge },
				{ label: '🎹 '+_('Piano'), signal: EqualizerPresetSignalList.Piano },
				{ label: '🎸 '+_('Pop'), signal: EqualizerPresetSignalList.Pop },
				{ label: '🎹 '+_('RnB'), signal: EqualizerPresetSignalList.RnB },
				{ label: '🎸 '+_('Rock'), signal: EqualizerPresetSignalList.Rock },
				{ label: '🔉 '+_('Small Speaker(s)'), signal: EqualizerPresetSignalList.SmallSpeakers },
				{ label: '👄 '+_('Spoken Word'), signal: EqualizerPresetSignalList.SpokenWord },
				{ label: '🎼 '+_('Treble Booster'), signal: EqualizerPresetSignalList.TrebleBooster },
				{ label: '🚫 '+_('Treble Reducer'), signal: EqualizerPresetSignalList.TrebleReducer },
			];
			this.addAllInListAsButtons(EqualizerPresetButtonList, EqualizerPresetMenu);

			//Separation
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

			//Add settings button
			let settingsButton = new PopupMenu.PopupMenuItem(_('Settings'));
			settingsButton.connect('activate', () => this.extension.openPreferences())
			this.menu.addMenuItem(settingsButton);
		}

		addAllInListAsButtons (List: {label: string, signal: string}[], Submenu: PopupMenu.PopupSubMenuMenuItem) {
			for (let i = 0; i < List.length; i++) {
				//Creates the button
				let button = new PopupMenu.PopupMenuItem(List[i].label);
		
				//Adds it to its respective submenu
				Submenu.menu.addMenuItem(button);
		
				//Binds button to command
				button.connect('activate', () => this.extension.signalHandler(List[i].signal))
			}
		}

		// Lots of ugly bypasses, will have to fix later.
		applyPosition(){
			const boxes: { 0: any; 1: any; 2: any } = {
				// @ts-expect-error _leftBox not in types
				0: Main.panel._leftBox,
				// @ts-expect-error _centerBox not in types
				1: Main.panel._centerBox,
				// @ts-expect-error _rightBox not in types
				2: Main.panel._rightBox
			};
			const position = this.extension.settings.get_int('position');
			const index = this.extension.settings.get_int('position-number');

			// @ts-expect-error
			Main.panel._addToPanelBox(this.extension.uuid, this, index, boxes[position]);
		}
	
		destroy(): void {
			super.destroy();
		}
	}
);