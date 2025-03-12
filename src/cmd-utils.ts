import RepeatLastCommands from "./main"
import { Notice } from "obsidian";
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
    values.map(async (value: any) => {
        if (value.item.id in aliases) {
            value.item.name = aliases[value.item.id].name
        }
    })
}

export function getBackSelection(chooser: any, selectedItem: number) {
    for (let i = 1; i <= selectedItem; i++) {
        try {
            if (selectedItem)
                chooser.moveDown(1)
        } catch {
        }
    }
}

export function getCommandName(id: string) {
    const command = this.app.commands.findCommand(id);
    return command.name;
}

export function getCommandIds(names: string[]) {
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
    // suggestion name {aliasName} 
    const existingAlias = commandName.match(/[^\s]+ {(.+?)}/);
    if (existingAlias) {
        const existingValue = existingAlias[1];
        if (value === "") {
            text = `${commandName.replace(`{${existingValue}}`, "")}`.trim()
            delete aliases[selectedId];
            delete plugin.settings.permanentAliases[selectedId]; // Also delete from permanentAliases
        }
        else {
            text = `${commandName.replace(`{${existingValue}}`, `{${value}}`)}`.trim();
            aliases[selectedId] = { name: text }
            plugin.settings.permanentAliases[selectedId] = text; // Add to permanentAliases
        }
    }
    // suggestion name with : or just suggestion name → create alias
    else {
        const parts = commandName.split(": ")
        if (parts.length > 1) {
            text = `${parts[0]}: {${value}} ${parts[1]}`.trim()
            aliases[selectedId] = { name: text }
            plugin.settings.permanentAliases[selectedId] = text; // Add to permanentAliases
        } else {
            const prefix = value ? `{${value}}` : ""
            text = `${commandName} ${prefix}`.trim()
            if (value) {
                aliases[selectedId] = { name: text }
                plugin.settings.permanentAliases[selectedId] = text; // Add to permanentAliases
            } else {
                delete aliases[selectedId];
                delete plugin.settings.permanentAliases[selectedId]; // Also delete from permanentAliases
            }
        }
    }
    chooser.values[selectedItem].item.name = text

    const { modal, instance, cmdPalette } = getModalCmdVars(plugin)
    await plugin.saveSettings();  
    await modal.updateSuggestions()
}