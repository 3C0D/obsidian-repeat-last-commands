import { Notice, Plugin, type Command } from 'obsidian';
import { type RLCSettings, DEFAULT_SETTINGS } from "./types";
import { getConditions, getModalCmdVars } from './cmd-utils';
import { onCommandTrigger, shouldExcludeCommand } from './palette';
import { around } from 'monkey-around';
import { CommandManager } from './command-manager';
import { KeyboardManager } from './keyboard-manager';
import { registerCommandFilter } from './command-filter';
import { UIManager } from './ui-manager';

export default class RepeatLastCommands extends Plugin {
	settings: RLCSettings;
	commandManager: CommandManager;
	keyboardManager: KeyboardManager;
	uiManager: UIManager;


	async onload() {
		// Load user settings from storage
		await this.loadSettings();

		// Initialize the command manager that centralizes recent commands execution logic
		this.commandManager = new CommandManager(this);

		// Initialize the keyboard manager for command palette shortcuts
		this.keyboardManager = new KeyboardManager(this);

		// Initialize the UI manager for interface elements
		this.uiManager = new UIManager(this);


		// this.addSettingTab(new RLCSettingTab(this));

		// Register filter that modifies command display (aliases, exclusions)
		this.register(registerCommandFilter(this));

		// Monitor command palette opening to add additional information
		this.register(onCommandTrigger(this));

		// Configure specific keyboard shortcuts in the command palette (Ctrl+A, Ctrl+P, etc.)
		this.keyboardManager.registerKeyBindings();

		// Define command to repeat the last executed command
		this.addCommand({
			id: "repeat-last-command",
			name: "Repeat last command",
			editorCallback: async () => {
				await this.commandManager.executeLastCommand();
			}
		});

		// Define command to display and choose from recent commands
		this.addCommand({
			id: "repeat-commands",
			name: "Repeat commands",
			callback: async () => {
				await this.commandManager.showCommandsList();
			},
		});

		// Define command to copy the last command ID to clipboard
		this.addCommand({
			id: "get-last-command",
			name: "Copy last command id in clipbooard",
			callback: async () => {
				await this.commandManager.copyLastCommandId();
			},
		});
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