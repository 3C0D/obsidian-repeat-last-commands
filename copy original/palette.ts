import { around } from "monkey-around";
import RepeatLastCommands from "./main";
import { altEvent, hideCmd } from "./events";
import { aliasify, getBackSelection, getConditions } from "./cmd-utils";
import { ShowAgainCmds } from "./modals";
import type { Command } from "obsidian";

function addCPListeners(plugin: RepeatLastCommands) {//command palette
    addInfoPalette(plugin)
    addClickListener(plugin)
    setTimeout(() => { // delay to avoid conflict with repeat last commands shortcut (ctrl)
        addKeyboardListener(plugin)
    }, 800);
}

function onHKTrigger(plugin: RepeatLastCommands, id: string) {// after shortcut
    const { modal } = getModalCmdVars(plugin)
    if (!modal.win && !shouldExcludeCommand(plugin, id)) {
        applySelectedId(id!, plugin)
    }
}

export function onCommandTrigger(plugin: RepeatLastCommands) {//notice we must pass plugin to use it in cb
    const uninstallCommand = around(this.app.commands, {
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
    return uninstallCommand;
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

function getModalCmdVars(plugin: RepeatLastCommands) {
    const pluginCommand = plugin.app.internalPlugins.getPluginById("command-palette")
    const instance = pluginCommand.instance
    const modal = instance.modal
    return { modal, instance, pluginCommand }
}

function addInfoPalette(plugin: RepeatLastCommands) {
    const { modal } = getModalCmdVars(plugin);
    const resultContainerEl = modal.resultContainerEl;

    if (!plugin.infoDiv) {
        plugin.infoDiv = document.createElement('div');
        plugin.infoDiv.classList.add('result-container-afterend');
        plugin.infoDiv.textContent = "Ctrl A: alias | Crtl P: pin | Ctrl -: hide | Ctrl +: show | Ctrl h: hotkey";
        resultContainerEl.insertAdjacentElement("afterend", plugin.infoDiv);
    }
}

const showHotkeysFor = async function (
    evt: KeyboardEvent,
    selectedName: string
) {
    evt.preventDefault();
    await this.app.setting.open();
    await this.app.setting.openTabById("hotkeys");
    const tab = await this.app.setting.activeTab;
    tab.searchComponent.inputEl.value = selectedName;
    tab.updateHotkeyVisibility();
    tab.searchComponent.inputEl.blur();
    const old = this.app.setting.onClose
    this.app.setting.onClose = () => {
        this.app.commands.executeCommandById("command-palette:open")
        this.app.setting.onClose = old;
    }
};