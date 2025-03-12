import { Notice, Plugin, type Command } from 'obsidian';
import { type RLCSettings, DEFAULT_SETTINGS } from "./types";
import { addAlias, getConditions, getModalCmdVars } from './cmd-utils';
import { onCommandTrigger } from './palette';
import { AliasModal, hideCmd, ShowAgainCmds } from './modals';
import { around } from 'monkey-around';


export default class RepeatLastCommands extends Plugin {
	settings: RLCSettings;
	lastCommand: string | null
	lastCommands: string[] = []

	async onload() {
		await this.loadSettings();
		// this.addSettingTab(new RLCSettingTab(this));
		const { settings } = this
		this.register(around(this.app.commands.constructor.prototype, {
			listCommands(old) {
				return function (...args: any[]) {
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
				}
			}
		}));
		this.register(onCommandTrigger(this))
		this.modifyScope()
		// add command
		this.addCommand({
			id: "repeat-last-command",
			name: "Repeat last command",
			editorCallback: async (editor, ctx) => {
				const { instance } = getModalCmdVars(this)
				const currentCommandId = "repeat-last-commands:repeat-last-command";

				// Filter out the current command from recent commands
				instance.recentCommands = instance.recentCommands.filter(id => id !== currentCommandId);

				// Get the most recent command (excluding our command)
				const lastCommand = instance.recentCommands[0];
				if (lastCommand) {
					// Execute the last command
					this.app.commands.executeCommandById(lastCommand);
				}
			}
		})
	}

	modifyScope() {
		const { modal, instance, cmdPalette } = getModalCmdVars(this)
		const { scope } = modal

		// Add Ctrl+P key binding to the scope
		scope.keys.push({
			key: "P",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: (evt: KeyboardEvent) => {
				const { values, chooser } = getConditions(this)
				const selectedItem = chooser.selectedItem
				const selectedId = values[selectedItem]?.item.id

				// Toggle pinned status
				if (instance.options.pinned.includes(selectedId)) {
					instance.options.pinned = instance.options.pinned.filter(id => id !== selectedId)
				} else {
					instance.options.pinned.push(selectedId)
				}

				// Save using the plugin's command palette instance
				instance.saveSettings(cmdPalette)

				// Update view. better than getBackSelection()
				modal.close()
				this.app.commands.executeCommandById("command-palette:open")

				// evt.preventDefault()
			}
		})

		// Add Ctrl+A key binding for aliases
		scope.keys.push({
			key: "A",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: (evt: KeyboardEvent) => {
				const { values, chooser } = getConditions(this)
				const selectedItem = chooser.selectedItem

				new AliasModal(this.app, this, selectedItem, async (result) => {
					await addAlias(this, result, selectedItem)
				}).open()
			}
		})

		// Add Ctrl+ key binding to show command
		scope.keys.push({
			key: "+",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: (evt: KeyboardEvent) => {
				new ShowAgainCmds(this.app, this, modal).open()
			}
		})

		// Add Ctrl- key binding to hide command
		scope.keys.push({
			key: "-",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: async (evt: KeyboardEvent) => {
				const { values, chooser } = getConditions(this)
				const selectedItem = chooser.selectedItem
				await hideCmd(evt, this, selectedItem, chooser)
				modal.close()
				this.app.commands.executeCommandById("command-palette:open")
			}
		})

		// Add Ctrl+H key binding for hotkeys
		scope.keys.push({
			key: "H",
			modifiers: "Ctrl",
			scope: scope.keys[0].scope,
			func: async (evt: KeyboardEvent) => {
				const { values, chooser } = getConditions(this)
				const selectedItem = chooser.selectedItem
				const selectedName = values[selectedItem]?.item.name

				this.app.setting.open();
				this.app.setting.animateOpen();
				this.app.setting.openTabById("hotkeys");
				const tab = this.app.setting.activeTab!;
				const input = tab.containerEl.querySelector("input")!
				input.focus();
				input.value = selectedName;
				(tab as any).updateHotkeyVisibility();
				input.blur();
				const old = this.app.setting.onClose
				this.app.setting.onClose = () => {
					this.app.commands.executeCommandById("command-palette:open")
					this.app.setting.onClose = old;
				}
			}
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		// Remove all aliases when plugin is disabled
		this.removeAllAliases();
	}

	removeAllAliases() {
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

