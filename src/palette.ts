import type { Command } from "obsidian";
import { getModalCmdVars } from "./cmd-utils.ts";
import type RepeatLastCommands from "./main.ts";
import { around } from "monkey-around";

export function onCommandTrigger(plugin: RepeatLastCommands): any {//notice we must pass plugin to use it in cb
    return around(plugin.app.commands, {
        executeCommand(originalMethod) {
            return function (...args: Command[]): any {
                if (args[0].id === "command-palette:open") {
                    addCPListeners(plugin);
                } else {
                    console.log("args", args);
                    onHKTrigger(plugin, args[0].id);
                }
                const result = originalMethod && originalMethod.apply(this, args);
                return result;
            };
        },
    });
}

function addCPListeners(plugin: RepeatLastCommands): void {//command palette
    addInfoPalette(plugin);
    addCommandSelectionListener(plugin);
}

// when a command is not run from command palette.
function onHKTrigger(plugin: RepeatLastCommands, id: string): void {// after shortcut
    const { modal } = getModalCmdVars(plugin);
    // only if not win e.g run from hotkey
    if (!modal.win && !shouldExcludeCommand(plugin, id)) {
        applySelectedId(id!, plugin);
    }
}

function shouldExcludeCommand(plugin: RepeatLastCommands, commandId: string): boolean {
    const userExcludedIDs = plugin.settings.userExcludedIDs || [];

    return (
        commandId === "repeat-last-commands:repeat-last-command" ||
        commandId === "repeat-last-commands:repeat-commands" ||
        commandId === "repeat-last-commands:get-last-command" ||
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

function addInfoPalette(plugin: RepeatLastCommands): void {
    const { modal } = getModalCmdVars(plugin);
    const resultContainerEl = modal?.resultContainerEl;

    const existingInfoDiv = modal?.modalEl?.querySelector('.result-container-afterend');
    if (!existingInfoDiv && resultContainerEl) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'result-container-afterend';
        infoDiv.style.textAlign = 'center';
        infoDiv.textContent = "ctrl a: alias | ctrl p: pin | ctrl -: hide | ctrl +: show | ctrl h: edit hotkey";
        resultContainerEl.insertAdjacentElement("afterend", infoDiv);
        console.log("modal", modal);
    }
}

function addCommandSelectionListener(plugin: RepeatLastCommands): void {
    const { modal } = getModalCmdVars(plugin);
    if (!modal?.scope) return;

    // Intercepter la touche Enter pour capturer la commande sélectionnée
    modal.scope.register([], "Enter", () => {
        const chooser = modal.chooser;
        if (chooser && chooser.selectedItem !== undefined) {
            const selectedCommand = chooser.values[chooser.selectedItem];
            const commandId = selectedCommand?.item?.id;

            if (commandId && !shouldExcludeCommand(plugin, commandId)) {
                console.log("[RLC] Command selected from palette:", commandId);
                applySelectedId(commandId, plugin);
            }
        }
    });

    // Intercepter les clics sur les suggestions
    setTimeout(() => {
        const suggestions = modal.chooser?.suggestions;
        if (suggestions) {
            suggestions.forEach((suggestion: HTMLElement, index: number) => {
                suggestion.addEventListener('click', () => {
                    const chooser = modal.chooser;
                    const selectedCommand = chooser.values[index];
                    const commandId = selectedCommand?.item?.id;

                    if (commandId && !shouldExcludeCommand(plugin, commandId)) {
                        console.log("[RLC] Command clicked from palette:", commandId);
                        applySelectedId(commandId, plugin);
                    }
                });
            });
        }
    }, 100); // Petit délai pour s'assurer que les suggestions sont rendues
}