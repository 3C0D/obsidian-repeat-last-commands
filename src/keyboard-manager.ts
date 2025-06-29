import type RepeatLastCommands from './main.ts';
import { addAlias, getConditions, getModalCmdVars } from './cmd-utils.ts';
import { AliasModal, hideCmd, ExcludedCommandsModal } from './modals.ts';
import type { CommandPaletteModal, CommandPalettePlugin, CommandPalettePluginInstance, HotkeysSettingTab, SuggestModalChooser } from 'obsidian-typings';
import type { Command, FuzzyMatch, Scope } from 'obsidian';

export class KeyboardManager {
    constructor(private plugin: RepeatLastCommands) {
    }

    public registerKeyBindings(): void {
        const { modal, instance, cmdPalette } = getModalCmdVars(this.plugin);
        const { scope } = modal;

        this.registerPinCommand(scope, modal, instance, cmdPalette);
        this.registerAliasCommand(scope);
        this.registerShowCommand(scope, modal);
        this.registerHideCommand(scope, modal);
        this.registerHotkeyCommand(scope);
    }

    private registerPinCommand(scope: Scope, modal: CommandPaletteModal, instance: CommandPalettePluginInstance, cmdPalette: CommandPalettePlugin | null): void {
        scope.keys.push({
            key: "P",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async () => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                const selectedId = values?.[selectedItem]?.item.id;

                if (!selectedId) {
                    return;
                }

                // Toggle pinned status
                if (selectedId && instance.options.pinned.includes(selectedId)) {
                    instance.options.pinned = instance.options.pinned.filter((id: string) => id !== selectedId);
                } else if (selectedId) {
                    instance.options.pinned.push(selectedId);
                }

                // Save using the plugin's command palette instance
                if (cmdPalette) {
                    instance.saveSettings(cmdPalette);
                }

                // Update view
                modal.close();
                this.plugin.app.commands.executeCommandById("command-palette:open");

                const { values: newValues, chooser: newChooser } = getConditions(this.plugin);
                await getBackSelectionById(newChooser, newValues, selectedId);
            }
        });
    }

    private registerAliasCommand(scope: Scope): void {
        scope.keys.push({
            key: "A",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: () => {
                const { chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;

                new AliasModal(this.plugin.app, this.plugin, selectedItem, async (result) => {
                    await addAlias(this.plugin, result, selectedItem);
                    await getBackSelection(chooser, selectedItem);
                }).open();
            }
        });
    }

    private registerShowCommand(scope: Scope, modal: CommandPaletteModal): void {
        scope.keys.push({
            key: "+",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: () => {
                // Open the excluded commands modal without closing the palette
                new ExcludedCommandsModal(this.plugin.app, this.plugin, modal).open();
            }
        });
    }

    private registerHideCommand(scope: Scope, modal: CommandPaletteModal): void {
        scope.keys.push({
            key: "-",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async () => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;

                // Store the ID of the next command (if it exists)
                let nextItemId: string | undefined;
                if (values) {
                    nextItemId = selectedItem < values.length - 1
                        ? values[selectedItem + 1]?.item.id
                        : values[selectedItem]?.item.id;
                } else {
                    nextItemId = undefined;
                }

                await hideCmd(this.plugin, selectedItem, chooser);
                modal.close();
                this.plugin.app.commands.executeCommandById("command-palette:open");

                // Wait for the palette to reopen and select the next command
                setTimeout(async () => {
                    const { values: newValues, chooser: newChooser } = getConditions(this.plugin);
                    await getBackSelectionById(newChooser, newValues, nextItemId);
                }, 50);
            }
        });
    }

    private registerHotkeyCommand(scope: Scope): void {
        scope.keys.push({
            key: "H",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async () => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                if (!values) {
                    return;
                }
                const selectedName = values[selectedItem]?.item.name;

                this.plugin.app.setting.open();
                this.plugin.app.setting.animateOpen();
                this.plugin.app.setting.openTabById("hotkeys");
                const tab = this.plugin.app.setting.activeTab as HotkeysSettingTab;
                const input = tab.containerEl.querySelector("input")!;
                input.focus();
                input.value = selectedName;
                tab.updateHotkeyVisibility();
                input.blur();
                const old = this.plugin.app.setting.onClose;
                this.plugin.app.setting.onClose = (): void => {
                    this.plugin.app.commands.executeCommandById("command-palette:open");
                    this.plugin.app.setting.onClose = old;
                };
            }
        });
    }
}

export async function getBackSelection(chooser: any, selectedItem: number): Promise<void> {
    try {
        chooser.forceSetSelectedItem(selectedItem);
    } catch (err) {
        console.log("Error setting selection:", err);
    }
}

export async function getBackSelectionById(chooser: SuggestModalChooser<FuzzyMatch<Command>, CommandPaletteModal>, values: FuzzyMatch<Command>[] | null, itemId: string | undefined): Promise<void> {
    try {
        if (values && itemId) {
            const newIndex = values.findIndex(v => v.item.id === itemId);
            if (newIndex !== -1) {
                chooser.forceSetSelectedItem(newIndex, undefined as unknown as MouseEvent | KeyboardEvent);
            }
        }
    } catch (err) {
        console.log("Error finding item by ID:", err);
    }
}