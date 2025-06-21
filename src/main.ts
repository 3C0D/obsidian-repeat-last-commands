import { Notice, Plugin, type Command } from 'obsidian';
import { type RLCSettings, DEFAULT_SETTINGS } from "./types.ts";
import { addAlias, getConditions, getModalCmdVars } from './cmd-utils.ts';
import { onCommandTrigger } from './palette.ts';
import { AliasModal, hideCmd, ShowAgainCmds, LastCommandsModal } from './modals.ts';
import { around } from 'monkey-around';
import { RLCSettingTab } from './settings.ts';

export default class RepeatLastCommands extends Plugin {
	settings!: RLCSettings;
	lastCommand: string | null = null;
	lastCommands: string[] = [];

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new RLCSettingTab(this));

		const { settings } = this;
		this.register(around(this.app.commands.constructor.prototype, {
			listCommands(old) {
				return function (...args: any[]): Command[] {
					const commands: Command[] = old.call(this, ...args);
					// Filter excluded commands
					const filteredCommands = commands.filter((command) => !settings.excludeCommands.includes(command.id));
					// Apply aliases to command names
					if (settings.aliases) {
						filteredCommands.forEach(command => {
							if (settings.aliases[command.id] && settings.aliases[command.id].name) {
								command.name = settings.aliases[command.id].name;
							}
						});
					}
					return filteredCommands;
				};
			}
		}));

		this.register(onCommandTrigger(this));
		this.modifyScope();

		// add command
		this.addCommand({
			id: "repeat-last-command",
			name: "Repeat last command",
			callback: async () => {
				const { instance } = getModalCmdVars(this);

				// Use Obsidian's native recent commands first
				if (instance.recentCommands && instance.recentCommands.length > 0) {
					// Filter out ALL plugin commands from recent commands
					const filteredCommands = instance.recentCommands.filter((id: string) =>
						id !== "repeat-last-commands:repeat-last-command" &&
						id !== "repeat-last-commands:repeat-commands" &&
						id !== "repeat-last-commands:get-last-command"
					);
					const lastCommand = filteredCommands[0];
					if (lastCommand) {
						console.log("[RLC] Executing from Obsidian recent commands:", lastCommand);
						this.app.commands.executeCommandById(lastCommand);
						return;
					}
				}

				// Fallback to plugin's own tracking
				if (this.lastCommand) {
					console.log("[RLC] Executing from plugin tracking:", this.lastCommand);
					this.app.commands.executeCommandById(this.lastCommand);
				} else {
					const text = this.settings.ifNoCmdOpenCmdPalette ? "No last command.\nopening command palette..." : "No last command";
					new Notice(text, 2500);
					if (this.settings.ifNoCmdOpenCmdPalette) {
						setTimeout(() => {
							this.app.commands.executeCommandById("command-palette:open");
						}, 400);
					}
				}
			}
		});

		this.addCommand({
			id: "repeat-commands",
			name: "Repeat commands",
			callback: async () => {
				if (this.lastCommands.length) {
					new LastCommandsModal(this).open();
				} else {
					const text = this.settings.ifNoCmdOpenCmdPalette ? "No last command.\nopening command palette..." : "No last command";
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

	modifyScope(): void {
		const { modal, instance, cmdPalette } = getModalCmdVars(this);
		const { scope } = modal;

		// Add Ctrl+P key binding to the scope
		scope.keys.push({
			key: "P",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: () => {
				const { values, chooser } = getConditions(this);
				const selectedItem = chooser.selectedItem;
				const selectedId = values[selectedItem]?.item.id;
				// Toggle pinned status
				if (!instance.options.pinned) {
					instance.options.pinned = [];
				}
				if (instance.options.pinned.includes(selectedId)) {
					instance.options.pinned = instance.options.pinned.filter((id: string) => id !== selectedId);
				} else {
					instance.options.pinned.push(selectedId);
				}
				// Save using the plugin's command palette instance
				instance.saveSettings(cmdPalette);
				// Update view. better than getBackSelection()
				modal.close();
				this.app.commands.executeCommandById("command-palette:open");
			}
		});

		// Add Ctrl+A key binding for aliases
		scope.keys.push({
			key: "A",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: () => {
				const { chooser } = getConditions(this);
				const selectedItem = chooser.selectedItem;
				new AliasModal(this.app, this, selectedItem, async (result: string) => {
					await addAlias(this, result, selectedItem);
				}).open();
			}
		});

		// Add Ctrl+ key binding to show command
		scope.keys.push({
			key: "+",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: () => {
				new ShowAgainCmds(this.app, this, modal).open();
			}
		});

		// Add Ctrl- key binding to hide command
		scope.keys.push({
			key: "-",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: async () => {
				const { chooser } = getConditions(this);
				const selectedItem = chooser.selectedItem;
				await hideCmd(this, selectedItem, chooser);
				modal.close();
				this.app.commands.executeCommandById("command-palette:open");
			}
		});

		// Add Ctrl+H key binding for hotkeys
		scope.keys.push({
			key: "H",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: async () => {
				const { values, chooser } = getConditions(this);
				const selectedItem = chooser.selectedItem;
				const selectedName = values[selectedItem]?.item.name;
				this.app.setting.open();
				this.app.setting.animateOpen();
				this.app.setting.openTabById("hotkeys");
				const tab = this.app.setting.activeTab!;
				const input = tab.containerEl.querySelector("input")!;
				input.focus();
				input.value = selectedName;
				(tab as any).updateHotkeyVisibility();
				input.blur();
				const old = this.app.setting.onClose;
				this.app.setting.onClose = (): void => {
					this.app.commands.executeCommandById("command-palette:open");
					this.app.setting.onClose = old;
				};
			}
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	onunload(): void {
		// Remove all aliases when plugin is disabled
		this.removeAllAliases();
	}

	removeAllAliases(): void {
		// Get all commands
		const commands = this.app.commands.commands;

		// For each command that has an alias in our settings
		Object.keys(this.settings.aliases).forEach(commandId => {
			const command = commands[commandId];
			if (command) {
				// Find the original command name (without our alias)
				const originalName = command.name.replace(/\s*\[.*?\]\s*/g, '');
				// Reset to original name
				command.name = originalName;
			}
		});
	}
}