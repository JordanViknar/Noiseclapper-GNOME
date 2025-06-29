import Gio from "gi://Gio";

export interface Device {
    model: string;
    mac: string
}

export class OpenSCQ30Client {
    constructor(private path: string) {

    }

    private async processCommand(args: string[]): Promise<string> {
        const proc = Gio.Subprocess.new(
            [this.path, ...args],
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
                    
                    const [success, stdout, stderr] = proc.communicate_utf8_finish(result);
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

    public async getDevices(): Promise<Device[]> {
        const stdout = await this.processCommand(["paired-devices", "list"])

        return stdout
            .trim()
            .split("\n")
            .slice(3)
            .filter(line => !line.startsWith("+"))
            .map(line => line.split("|").map(field => field.trim()).slice(1))
            .map(([model, mac]) => ({ model, mac }))
    }


    public async getSettingsValue(mac: string, name: string): Promise<string> {
        const stdout = await this.processCommand(["device", "exec", "--get", name, "--mac-address", mac])

        return stdout
            .trim()
            .split("\n")
            .slice(3)
            .filter(line => !line.startsWith("+"))
            .map(line => line.split("|").map(field => field.trim()).slice(1))
            .map(([key, value]) => value)
            [0]

    }

    public async setSettingsValue(mac: string, name: string, value: string): Promise<void> {
        await this.processCommand(["device", "exec", "--set", `${name}=${value}`, "--mac-address", mac])
    }

    public async getAvailableSettings(mac: string): Promise<string[]> {
        const stdout = await this.processCommand(["device", "list-settings", "--no-headers", "--no-extended-info", "--mac-address", mac])

        return stdout.trim().split("\n");
    }

    public async addNewDevice(mac: string, model: string): Promise<void> {
        await this.processCommand(["paired-devices", "add", "--mac-address", mac, "--model", model])
    }

    public async getSettings(mac: string): Promise<Record<string, string>> {
        const availableSettings = await this.getAvailableSettings(mac);
        const settings: Record<string, string> = {};
        
        for (const setting of availableSettings) {
            settings[setting] = await this.getSettingsValue(mac, setting);
        }
        
        return settings;
    }
    
}