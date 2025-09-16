// ------------------------ Imports ----------------------------
import Gio from "gi://Gio";
import type GnomeBluetooth from "gi://GnomeBluetooth";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import { notifyError } from "resource:///org/gnome/shell/ui/main.js";

// ------------------------ Logging ------------------------
let logging: boolean;
export enum LogType {
	Info = 0,
	Warn = 1,
	Error = 2,
	Debug = 3,
}
export function logIfEnabled(type: LogType, message: string) {
	if (!logging) {
		return;
	}

	const prefix = "[Noiseclapper] ";
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

		default: {
			throw new Error("Invalid log type.");
		}
	}
}

export function updateLogging(enabled: boolean) {
	logging = enabled;
}

// ------------------------ Bluetooth ------------------------
