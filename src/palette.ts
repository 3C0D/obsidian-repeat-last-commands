import type { Command } from "obsidian";
import { getModalCmdVars } from "./cmd-utils";
import type RepeatLastCommands from "./main";
import { around } from "monkey-around";
import type { RLCSettings } from "./types";


export function onCommandTrigger(plugin: RepeatLastCommands) {//notice we must pass plugin to use it in cb
    return around(this.app.commands, {
        executeCommand(originalMethod) {
            return function (...args: Command[]) {
                if (args[0].id === "command-palette:open") addInfoPalette(plugin)
                // else onHKTrigger(plugin, args[0].id)
                const result =
                    originalMethod && originalMethod.apply(this, args);
                return result;
            };
        },
    });
}

function addInfoPalette(plugin: RepeatLastCommands) {
    const { modal } = getModalCmdVars(plugin);
    const resultContainerEl = modal.resultContainerEl;
    const existingInfoDiv = modal.modalEl.querySelector('.result-container-afterend')

    if (!existingInfoDiv) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'result-container-afterend';
        infoDiv.style.textAlign = 'center';
        infoDiv.textContent = "ctrl a: alias | crtl p: pin | ctrl -: hide | ctrl +: show | ctrl h: edit hotkey";
        resultContainerEl.insertAdjacentElement("afterend", infoDiv);
        console.log("modal", modal)
    }
}

// when a command is not run from command palette.
// function onHKTrigger(plugin: RepeatLastCommands, id: string) {
//     const { modal } = getModalCmdVars(plugin)
//     // if no win e.g run from hotkey
//     if (!modal.win && !shouldExcludeCommand(plugin.settings, id)) {
//         applySelectedId(id!, plugin)
//     }
// }

export function shouldExcludeCommand(settings: RLCSettings, commandId: string) {
    const userExcludedIDs = settings.userExcludedIDs || [];

    return (
        commandId === "repeat-last-commands:repeat-last-command" ||
        commandId === "repeat-last-commands:repeat-commands" ||
        commandId === "repeat-last-commands:get-last-command" ||
        userExcludedIDs.some(excludedID => commandId.startsWith(excludedID))
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