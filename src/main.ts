import { Plugin } from 'obsidian';
import { type RLCSettings, DEFAULT_SETTINGS } from "./types.ts";
import { onCommandTrigger } from './palette.ts';
import { CommandManager } from './command-manager.ts';
import { KeyboardManager } from './keyboard-manager.ts';
import { registerCommandFilter } from './command-filter.ts';
import { UIManager } from './ui-manager.ts';
import { RLCSettingTab } from './settings.ts';


// Another way to get command ID. suggester in settings or command get command ID
// Manage aliases find a way to show the number of aliases before to push the button or disabled button and tooltips no aliases created
// Hidden cmds: use a modal as the modal for aliases

export default class RepeatLastCommands extends Plugin {
	settings: RLCSettings;
	commandManager: CommandManager;
	keyboardManager: KeyboardManager;
	uiManager: UIManager;


	async onload(): Promise<void> {
		// Load user settings from storage
		await this.loadSettings();
		this.addSettingTab(new RLCSettingTab(this));

		// Initialize the command manager that centralizes recent commands execution logic
		this.commandManager = new CommandManager(this);

		// Initialize the keyboard manager for command palette shortcuts
		this.keyboardManager = new KeyboardManager(this);

		// Initialize the UI manager for interface elements
		this.uiManager = new UIManager(this);

		// Register filter that modifies command display (aliases, exclusions)
		this.register(registerCommandFilter(this));

		// Monitor command palette opening to add additional information
		this.register(onCommandTrigger(this));

		// Configure specific keyboard shortcuts in the command palette (Ctrl+A, Ctrl+P, etc.)
		this.keyboardManager.registerKeyBindings();

		// Define command to repeat the last executed command
		this.addCommand({
			id: "repeat-last-command",
			name: "Last command",
			callback: async () => {
				await this.commandManager.executeLastCommand();
			}
		});

		// Define command to display and choose from recent commands
		this.addCommand({
			id: "repeat-commands",
			name: "Last commands modal",
			callback: async () => {
				await this.commandManager.showCommandsList();
			},
		});

		// Define command to copy the last command ID to clipboard
		this.addCommand({
			id: "get-last-command",
			name: "Copy last command ID",
			callback: async () => {
				await this.commandManager.copyLastCommandId();
			},
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
				const originalName = command.name.replace(/^\[.*?\]\s*/, '');
				// Reset to original name
				command.name = originalName;
			}
		});
	}
}