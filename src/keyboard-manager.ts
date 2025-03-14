import type RepeatLastCommands from './main';
import { addAlias, getConditions, getModalCmdVars } from './cmd-utils';
import { AliasModal, hideCmd, ShowAgainCmds } from './modals';
import type { CommandPaletteModal, CommandPaletteInstance, CommandPalette, CommandScope } from './types';

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

    private registerPinCommand(scope: CommandScope, modal: CommandPaletteModal, instance: CommandPaletteInstance, cmdPalette: CommandPalette): void {
        scope.keys.push({
            key: "P",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async () => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                const selectedId = values[selectedItem]?.item.id;

                // Toggle pinned status
                if (instance.options.pinned.includes(selectedId)) {
                    instance.options.pinned = instance.options.pinned.filter((id: string) => id !== selectedId);
                } else {
                    instance.options.pinned.push(selectedId);
                }

                // Save using the plugin's command palette instance
                instance.saveSettings(cmdPalette);

                // Update view
                modal.close();
                this.plugin.app.commands.executeCommandById("command-palette:open");

                const { values: newValues, chooser: newChooser } = getConditions(this.plugin);
                await getBackSelectionById(newChooser, newValues, selectedId);
            }
        });
    }

    private registerAliasCommand(scope: CommandScope): void {
        scope.keys.push({
            key: "A",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: () => {
                const { chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;

                new AliasModal(this.plugin.app, this.plugin, selectedItem, async (result) => {
                    await addAlias(this.plugin, result, selectedItem);
                    const { modal, instance, cmdPalette } = getModalCmdVars(this.plugin);
                    await getBackSelection(chooser, selectedItem);
                }).open();
            }
        });
    }

    private registerShowCommand(scope: CommandScope, modal: CommandPaletteModal): void {
        scope.keys.push({
            key: "+",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: () => {
                new ShowAgainCmds(this.plugin.app, this.plugin, modal).open();
            }
        });
    }

    private registerHideCommand(scope: CommandScope, modal: CommandPaletteModal): void {
        scope.keys.push({
            key: "-",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async () => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                
                // Mémoriser l'ID de la commande suivante (si elle existe)
                const nextItemId = selectedItem < values.length - 1 
                    ? values[selectedItem + 1]?.item.id 
                    : values[selectedItem]?.item.id;
                
                await hideCmd(this.plugin, selectedItem, chooser);
                modal.close();
                this.plugin.app.commands.executeCommandById("command-palette:open");
                
                // Attendre que la palette se rouvre et sélectionner la commande suivante
                setTimeout(async () => {
                    const { values: newValues, chooser: newChooser } = getConditions(this.plugin);
                    await getBackSelectionById(newChooser, newValues, nextItemId);
                }, 50);
            }
        });
    }

    private registerHotkeyCommand(scope: CommandScope): void {
        scope.keys.push({
            key: "H",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async () => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                const selectedName = values[selectedItem]?.item.name;

                this.plugin.app.setting.open();
                this.plugin.app.setting.animateOpen();
                this.plugin.app.setting.openTabById("hotkeys");
                const tab = this.plugin.app.setting.activeTab!;
                const input = tab.containerEl.querySelector("input")!;
                input.focus();
                input.value = selectedName;
                (tab as any).updateHotkeyVisibility();
                input.blur();
                const old = this.plugin.app.setting.onClose;
                this.plugin.app.setting.onClose = () => {
                    this.plugin.app.commands.executeCommandById("command-palette:open");
                    this.plugin.app.setting.onClose = old;
                };
            }
        });
    }
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