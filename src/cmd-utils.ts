import RepeatLastCommands from "./main"
import { App, Notice } from "obsidian";
import type { CommandPalette, CommandPaletteInstance } from "./types";

export function getCmdPalette(plugin: RepeatLastCommands):CommandPalette {
    return plugin.app.internalPlugins.getPluginById("command-palette")
}

export function getModalCmdVars(plugin: RepeatLastCommands) {
    const cmdPalette = getCmdPalette(plugin)
    if (!cmdPalette) {
        new Notice("Command Palette not found")}
    const instance: CommandPaletteInstance = cmdPalette?.instance
    const modal = instance?.modal
    return { modal, instance, cmdPalette }
}

export function getConditions(plugin: RepeatLastCommands) {
    const { modal } = getModalCmdVars(plugin)
    const chooser = modal.chooser
    const values = chooser.values
    const { aliases } = plugin.settings
    return { values, aliases, chooser }
}

export function aliasify(values: any, aliases: any) {
    values.map((value: any) => {
        if (value.item.id in aliases) {
            value.item.name = aliases[value.item.id].name
        }
    })
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

export function getCommandIdsByNames(names: string[]) {
    const ids: string[] = []
    for (const key in this.app.commands.commands) {
        const command = this.app.commands.commands[key];
        if (names.includes(command.name)) {
            ids.push(command.id)
        }
    }
    return ids;
}

export async function addAlias(plugin: RepeatLastCommands, result: string, selectedItem: number) {
    const { values, aliases, chooser } = getConditions(plugin)
    const { item } = values[selectedItem]
    const selectedId = item.id
    const value = result?.trim() ?? ""
    const { commands } = this.app.commands
    const commandName = commands[selectedId].name
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
    
    chooser.values[selectedItem].item.name = text

    const { modal } = getModalCmdVars(plugin)
    await plugin.saveSettings();  
    await modal.updateSuggestions()
}

export async function getBackSelection(chooser: any, selectedItem: number) {
    try {
        chooser.forceSetSelectedItem(selectedItem);
    } catch (err) {
        console.log("Error setting selection:", err);
    }
}

export async function getBackSelectionById(chooser: any, values: any[], itemId: string) {
    try {
        const newIndex = values.findIndex(v => v.item.id === itemId);
        if (newIndex !== -1) {
            chooser.forceSetSelectedItem(newIndex);
        }
    } catch (err) {
        console.log("Error finding item by ID:", err);
    }
}