import { around } from "monkey-around";
import type RepeatLastCommands from "./main.ts";
import type { Command } from "obsidian";

function addCPListeners(plugin: RepeatLastCommands): void { // command palette
    addInfoPalette(plugin);
    // Note: Other listeners like click and keyboard are handled elsewhere
}

function onHKTrigger(plugin: RepeatLastCommands, id: string): void { // after shortcut
    const { modal } = getModalCmdVars(plugin);
    if (modal && !modal.win && !shouldExcludeCommand(plugin, id)) {
        applySelectedId(id, plugin);
    }
}

export function onCommandTrigger(plugin: RepeatLastCommands): any {
    return around(plugin.app.commands, {
        executeCommand(originalMethod) {
            return function (...args: Command[]): any {
                if (args[0].id === "command-palette:open") {
                    addCPListeners(plugin);
                } else {
                    onHKTrigger(plugin, args[0].id);
                }
                const result = originalMethod && originalMethod.apply(this, args);
                return result;
            };
        },
    });
}

function shouldExcludeCommand(plugin: RepeatLastCommands, commandId: string): boolean {
    const userExcludedIDs = plugin.settings.userExcludedIDs || [];

    return (
        commandId === "repeat-last-commands:repeat-last-command" ||
        commandId === "repeat-last-commands:get-last-command" ||
        commandId === "repeat-last-commands:repeat-commands" ||
        (!plugin.settings.includeCmdPaletteOPen && commandId === "command-palette:open") ||
        userExcludedIDs.some(excludedID => commandId.startsWith(excludedID))
    );
}

function applySelectedId(id: string, plugin: RepeatLastCommands): void {
    // command
    const { lastCommands, settings } = plugin;
    plugin.lastCommand = id;

    // commands
    const maxEntries = settings.maxLastCmds;
    if (lastCommands.length > maxEntries) {
        lastCommands.shift();
    }
    lastCommands.push(id);
    plugin.lastCommands = [...new Set(lastCommands)];
    plugin.saveSettings();
}

function getModalCmdVars(plugin: RepeatLastCommands): { modal: any, instance: any, pluginCommand: any } {
    const pluginCommand = plugin.app.internalPlugins.getPluginById("command-palette");
    const instance = pluginCommand?.instance;
    const modal = instance?.modal;
    return { modal, instance, pluginCommand };
}

function addInfoPalette(plugin: RepeatLastCommands): void {
    const { modal } = getModalCmdVars(plugin);
    const resultContainerEl = modal?.resultContainerEl;

    if (resultContainerEl && !plugin.infoDiv) {
        plugin.infoDiv = document.createElement('div');
        plugin.infoDiv.classList.add('result-container-afterend');
        plugin.infoDiv.textContent = "Ctrl A: alias | Ctrl P: pin | Ctrl -: hide | Ctrl +: show | Ctrl h: hotkey";
        resultContainerEl.insertAdjacentElement("afterend", plugin.infoDiv);
    }
}