import RepeatLastCommands from "./main.ts";
import { App, Notice, type Command, type FuzzyMatch } from "obsidian";
import type { CommandPaletteModal, CommandPalettePlugin, CommandPalettePluginInstance, SuggestModalChooser } from 'obsidian-typings';

export function getCmdPalette(plugin: RepeatLastCommands): CommandPalettePlugin | null {
    const cmdPalette = plugin.app.internalPlugins.getPluginById("command-palette");
    if (!cmdPalette) {
        return null;
    }
    return cmdPalette;
}

export function getModalCmdVars(plugin: RepeatLastCommands): {
    modal: CommandPaletteModal,
    instance: CommandPalettePluginInstance,
    cmdPalette: CommandPalettePlugin
} {
    const cmdPalette = getCmdPalette(plugin);
    if (!cmdPalette) {
        new Notice("Command palette plugin not found");
        throw new Error("Command palette plugin not found");
    }
    const instance = cmdPalette.instance;
    const modal = instance.modal;
    return { modal, instance, cmdPalette };
}

export function getConditions(plugin: RepeatLastCommands): {
    values: FuzzyMatch<Command>[] | null,
    aliases: Record<string, Record<string, string>>,
    chooser: SuggestModalChooser<FuzzyMatch<Command>, CommandPaletteModal>
} {
    const { modal } = getModalCmdVars(plugin);
    const chooser = modal.chooser;
    const values = chooser.values;
    const { aliases } = plugin.settings;
    return { values, aliases, chooser };
}



export function getCommandName(app: App, id: string): string {
    try {
        const command = app.commands.findCommand(id);
        if (command) {
            return command.name;
        }
    } catch (err) {
        console.log("Error finding command:", err);
    }
    return id; // Return the ID if the name is not found
}



/**
 * Adds an [alias] at the beginning of the command. If no alias is provided, the existing alias is removed.
 */
export async function addAlias(plugin: RepeatLastCommands, result: string, selectedItem: number): Promise<void> {
    const { values, aliases, chooser } = getConditions(plugin);
    if (!values) {
        new Notice("No commands available to alias.");
        return;
    }
    const { item } = values[selectedItem];
    const selectedId = item.id;
    const value = result?.trim() ?? "";
    const { commands } = plugin.app.commands;
    const commandName = commands[selectedId].name;
    let text: string;

    // Remove any existing alias (format [alias])
    const cleanedName = commandName.replace(/^\[.*?\]\s*/, '');

    if (value === "") {
        // If no alias is provided, simply remove the existing alias
        text = cleanedName;
        delete aliases[selectedId];
    } else {
        // Add the new alias at the beginning of the name
        text = `[${value}] ${cleanedName}`;
        aliases[selectedId] = { name: text };
    }

    if (chooser.values) {
        chooser.values[selectedItem].item.name = text;
    }

    const { modal } = getModalCmdVars(plugin);
    await plugin.saveSettings();
    modal.updateSuggestions();
}

export async function getBackSelection(chooser: any, selectedItem: number): Promise<void> {
    try {
        chooser.forceSetSelectedItem(selectedItem);
    } catch (err) {
        console.log("Error setting selection:", err);
    }
}

export async function getBackSelectionById(chooser: any, values: any[], itemId: string): Promise<void> {
    try {
        const newIndex = values.findIndex(v => v.item.id === itemId);
        if (newIndex !== -1) {
            chooser.forceSetSelectedItem(newIndex);
        }
    } catch (err) {
        console.log("Error finding item by ID:", err);
    }
}