// External Imports
import St from 'gi://St'
import GObject from 'gi://GObject'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension, gettext as _, ngettext, pgettext} from 'resource:///org/gnome/shell/extensions/extension.js';

// Internal Imports
import NoiseclapperExtension from './extension.js';
import {LogType, logIfEnabled} from './general.js';

export default GObject.registerClass(
	class NoiseclapperIndicator extends PanelMenu.Button {
		private extension!: NoiseclapperExtension;
	
		constructor(extension: NoiseclapperExtension) {
			logIfEnabled(LogType.Debug,"Initializing Noiseclapper indicator...");
	
			super(0, 'Noiseclapper')
			this.extension = extension
	
			//This will add a box object to the panel. It's basically the extension's button.
			const box = new St.BoxLayout({ vertical: false, styleClass: 'panel-status-menu-box' });
	
			//We create a GTK symbolic icon in the panel
			const icon = new St.Icon({ iconName: 'audio-headphones-symbolic', styleClass: 'system-status-icon' });
			try {
				box.add_child(icon); // GNOME 46+
			} catch {
				box.add_actor(icon); // GNOME 45
			}
	
			//The 2 submenus
			let NoiseCancellingModeMenu = new PopupMenu.PopupSubMenuMenuItem(_('Noise Cancelling Mode'));
			this.menu.addMenuItem(NoiseCancellingModeMenu);
			let EqualizerPresetMenu = new PopupMenu.PopupSubMenuMenuItem(_('Equalizer Preset'));
			this.menu.addMenuItem(EqualizerPresetMenu);
		}
	
		destroy(): void {
			super.destroy();
		}
	}
);