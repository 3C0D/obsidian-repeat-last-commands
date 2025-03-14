import { Notice } from 'obsidian';
import type RepeatLastCommands from './main';
import { getModalCmdVars } from './cmd-utils';
import type { CommandPaletteInstance } from './types';
import { LastCommandsModal } from './modals';

export class CommandManager {
    private instance: CommandPaletteInstance;

    constructor(private plugin: RepeatLastCommands) {
        const { instance } = getModalCmdVars(this.plugin);
        this.instance = instance;
    }

    public async executeLastCommand(): Promise<void> {
        const lastCommand = this.instance.recentCommands[0];

        if (!lastCommand) {
            this.handleNoCommand();
        } else {
            new Notice(`Last command: ${lastCommand}`);
            this.plugin.app.commands.executeCommandById(lastCommand);
        }
    }

    public async showCommandsList(): Promise<void> {
        const lastCommands = this.instance.recentCommands;

        if (lastCommands.length) {
            new LastCommandsModal(this.plugin).open();
        } else {
            this.handleNoCommand();
        }
    }

    public async copyLastCommandId(): Promise<void> {
        const lastCommand = this.instance.recentCommands[0];

        if (lastCommand) {
            try {
                await navigator.clipboard.writeText(lastCommand);
                new Notice("Command id copied in clipboard");
            } catch (err) {
                console.error(err);
            }
        } else {
            new Notice("No last command");
        }
    }

    // Opens command palette by default when no command is found
    private handleNoCommand(): void {
        new Notice("No last command.\nOpening command palette...");

        setTimeout(() => {
            this.plugin.app.commands.executeCommandById("command-palette:open");
        }, 400);
    }
}