import { Notice, type Command } from 'obsidian';
import type RepeatLastCommands from './main';
import { getModalCmdVars } from './cmd-utils';
import type { RLCSettings } from './types';
import { LastCommandsModal } from './modals';

export class CommandManager {
    private plugin: RepeatLastCommands;
    private settings: RLCSettings;
    
    constructor(plugin: RepeatLastCommands) {
        this.plugin = plugin;
        this.settings = plugin.settings;
    }
    
    public async executeLastCommand(): Promise<void> {
        const { instance } = getModalCmdVars(this.plugin);
        const lastCommand = instance.recentCommands[0];
        
        if (!lastCommand) {
            this.handleNoCommand();
        } else {
            new Notice(`Last command: ${lastCommand}`);
            this.plugin.app.commands.executeCommandById(lastCommand);
        }
    }
    
    public async showCommandsList(): Promise<void> {
        const { instance } = getModalCmdVars(this.plugin);
        const lastCommands = instance.recentCommands;
        
        if (lastCommands.length) {
            new LastCommandsModal(this.plugin).open();
        } else {
            this.handleNoCommand();
        }
    }
    
    public async copyLastCommandId(): Promise<void> {
        const { instance } = getModalCmdVars(this.plugin);
        const lastCommand = instance.recentCommands[0];
        
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
    
    private handleNoCommand(): void {
        const text = this.settings.ifNoCmdOpenCmdPalette 
            ? "No last command.\nopening command palette..." 
            : "No last command";
            
        new Notice(text);
        
        if (this.settings.ifNoCmdOpenCmdPalette) {
            setTimeout(() => {
                this.plugin.app.commands.executeCommandById("command-palette:open");
            }, 400);
        }
    }
}