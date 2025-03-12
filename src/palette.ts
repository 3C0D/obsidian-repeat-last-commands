import type { Command } from "obsidian";
import { getModalCmdVars } from "./cmd-utils";
import type RepeatLastCommands from "./main";
import { around } from "monkey-around";


export function onCommandTrigger(plugin: RepeatLastCommands) {//notice we must pass plugin to use it in cb
    return around(this.app.commands, {
        executeCommand(originalMethod) {
            return function (...args: Command[]) {
                if (args[0].id === "command-palette:open") addCPListeners(plugin)
                else onHKTrigger(plugin, args[0].id)
                const result =
                    originalMethod && originalMethod.apply(this, args);
                return result;
            };
        },
    });
}

function addCPListeners(plugin: RepeatLastCommands) {//command palette
    addInfoPalette(plugin)
    // addClickListener(plugin)
    // setTimeout(() => { // delay to avoid conflict with repeat last commands shortcut (ctrl)
    //     addKeyboardListener(plugin)
    // }, 800);
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
function onHKTrigger(plugin: RepeatLastCommands, id: string) {// after shortcut
    const { modal } = getModalCmdVars(plugin)
    // only if not win e.g run from hotkey
    if (!modal.win && !shouldExcludeCommand(plugin, id)) {
        applySelectedId(id!, plugin)
    }
}

function shouldExcludeCommand(plugin: RepeatLastCommands, commandId: string) {
    const userExcludedIDs = plugin.settings.userExcludedIDs || [];

    return (
        commandId === "repeat-last-commands:repeat-command" ||
        commandId === "repeat-last-commands:get-last-command" ||
        userExcludedIDs.some(excludedID => commandId.startsWith(excludedID))
    );
}

function applySelectedId(id: string, plugin: RepeatLastCommands) {
    // command
    const { lastCommands, settings } = plugin
    plugin.lastCommand = id

    // commands
    const maxEntries = settings.maxLastCmds;
    if (lastCommands.length > maxEntries) {
        lastCommands.shift();
    }
    lastCommands.push(id)
    plugin.lastCommands = [...new Set(lastCommands)];
    plugin.saveSettings()
}