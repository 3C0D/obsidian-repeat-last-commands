import type { Command } from "obsidian";
import { getModalCmdVars } from "./cmd-utils";
import type RepeatLastCommands from "./main";
import { around } from "monkey-around";
import type { RLCSettings } from "./types";


export function onCommandTrigger(plugin: RepeatLastCommands) {
    return around(plugin.app.commands, {
        executeCommand(originalMethod) {
            return function (...args: Command[]) {
                if (args[0].id === "command-palette:open") {
                    plugin.uiManager.addInfoToPalette();
                }
                const result = originalMethod && originalMethod.apply(this, args);
                return result;
            };
        },
    });
}

export function shouldExcludeCommand(settings: RLCSettings, commandId: string) {
    return (
        commandId === "repeat-last-commands:repeat-last-command" ||
        commandId === "repeat-last-commands:repeat-commands" ||
        commandId === "repeat-last-commands:get-last-command" ||
        settings.excludeCommands.includes(commandId)
    );
}

// function applySelectedId(id: string, plugin: RepeatLastCommands) {
//     // command
//     const { settings } = plugin
//     const { instance } = getModalCmdVars(this.plugin)
//     const lastCommands = instance.recentCommands;
//     // plugin.lastCommand = id // Est ce qu'on doit enregistrer cette commande ?

//     // commands
//     const maxEntries = settings.maxLastCmds;
//     if (lastCommands.length > maxEntries) {
//         lastCommands.shift();
//     }
//     lastCommands.push(id)
//     lastCommands = [...new Set(lastCommands)];
//     plugin.saveSettings()
// }