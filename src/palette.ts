import type { Command } from "obsidian";
import type RepeatLastCommands from "./main.ts";
import { around } from "monkey-around";
import type { RLCSettings } from "./types.ts";

export function onCommandTrigger(plugin: RepeatLastCommands): any {
    return around(plugin.app.commands, {
        executeCommand(originalMethod) {
            return function (...args: Command[]): any {
                if (args[0].id === "command-palette:open") {
                    plugin.uiManager.addInfoToPalette();
                }
                const result = originalMethod && originalMethod.apply(this, args);
                return result;
            };
        },
    });
}

export function shouldExcludeCommand(settings: RLCSettings, commandId: string): boolean {
    return (
        commandId === "repeat-last-commands:repeat-last-command" ||
        commandId === "repeat-last-commands:repeat-commands" ||
        commandId === "repeat-last-commands:get-last-command" ||
        settings.excludeCommands.includes(commandId)
    );
}