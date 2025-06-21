import { Notice, Plugin, type Command } from 'obsidian';
import { around } from 'monkey-around';
import { onCommandTrigger } from './palette.ts';
import { RLCSettingTab } from './settings.ts';
import { LastCommandsModal } from './modals.ts';
import { getCommandName } from './cmd-utils.ts';
import { DEFAULT_SETTINGS, type RLCSettings } from './types.ts';

export default class RepeatLastCommands extends Plugin {
	settings!: RLCSettings;
	lastCommand: string | null = null;
	lastCommands: string[] = [];
	infoDiv: HTMLDivElement | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new RLCSettingTab(this));

		const { settings } = this;
		this.register(around(this.app.commands.constructor.prototype, {
			listCommands(old) {
				// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
				return function (...args: any[]) {
					const commands: Command[] = old.call(this, ...args);
					return commands.filter((command) => !settings.excludeCommands.includes(command.id));
				};
			}
		}));

		this.register(onCommandTrigger(this));

		const text = this.settings.ifNoCmdOpenCmdPalette ? "No last command.\nopening command palette..." : "No last command";

		this.addCommand({
			id: "repeat-last-command",
			name: "Repeat last command",
			callback: async () => {
				if (this.lastCommand) {
					if (this.settings.notify) {
						new Notice(`Repeated: ${getCommandName(this.app, this.lastCommand)}`);
					}
					console.log("this.lastCommand", this.lastCommand);
					this.app.commands.executeCommandById(this.lastCommand);
				} else {
					new Notice(text, 2500);
					if (this.settings.ifNoCmdOpenCmdPalette) {
						setTimeout(() => {
							this.app.commands.executeCommandById("command-palette:open");
						}, 400);
					}
				}
			},
		});

		this.addCommand({
			id: "repeat-commands",
			name: "Repeat commands",
			callback: async () => {
				if (this.lastCommands.length) {
					new LastCommandsModal(this).open();
				} else {
					new Notice(text, 2500);
					if (this.settings.ifNoCmdOpenCmdPalette) {
						setTimeout(() => {
							this.app.commands.executeCommandById("command-palette:open");
						}, 400);
					}
				}
			},
		});

		this.addCommand({
			id: "get-last-command",
			name: "Copy last command id in clipbooard",
			callback: async () => {
				if (this.lastCommand) {
					navigator.clipboard.writeText(this.lastCommand).then(() => {
						new Notice("Command id copied in clipboard");
					}).catch(err => { console.error(err); });
				} else {
					new Notice("No last command");
				}
			},
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}