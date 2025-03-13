import type RepeatLastCommands from './main';
import { addAlias, getConditions, getModalCmdVars } from './cmd-utils';
import { AliasModal, hideCmd, ShowAgainCmds } from './modals';

export class KeyboardManager {
    private plugin: RepeatLastCommands;
    
    constructor(plugin: RepeatLastCommands) {
        this.plugin = plugin;
    }
    
    public registerKeyBindings(): void {
        const { modal, instance, cmdPalette } = getModalCmdVars(this.plugin);
        const { scope } = modal;
        
        this.registerPinCommand(scope, instance, cmdPalette);
        this.registerAliasCommand(scope);
        this.registerShowCommand(scope, modal);
        this.registerHideCommand(scope, modal);
        this.registerHotkeyCommand(scope);
    }
    
    private registerPinCommand(scope: any, instance: any, cmdPalette: any): void {
        const { modal } = getModalCmdVars(this.plugin);
        scope.keys.push({
            key: "P",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: (evt: KeyboardEvent) => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                const selectedId = values[selectedItem]?.item.id;

                // Toggle pinned status
                if (instance.options.pinned.includes(selectedId)) {
                    instance.options.pinned = instance.options.pinned.filter(id => id !== selectedId);
                } else {
                    instance.options.pinned.push(selectedId);
                }

                // Save using the plugin's command palette instance
                instance.saveSettings(cmdPalette);

                // Update view
                modal.close();
                this.plugin.app.commands.executeCommandById("command-palette:open");
            }
        });
    }
    
    private registerAliasCommand(scope: any): void {
        scope.keys.push({
            key: "A",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: (evt: KeyboardEvent) => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;

                new AliasModal(this.plugin.app, this.plugin, selectedItem, async (result) => {
                    await addAlias(this.plugin, result, selectedItem);
                }).open();
            }
        });
    }
    
    private registerShowCommand(scope: any, modal: any): void {
        scope.keys.push({
            key: "+",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: (evt: KeyboardEvent) => {
                new ShowAgainCmds(this.plugin.app, this.plugin, modal).open();
            }
        });
    }
    
    private registerHideCommand(scope: any, modal: any): void {
        scope.keys.push({
            key: "-",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async (evt: KeyboardEvent) => {
                const { values, chooser } = getConditions(this.plugin);
                const selectedItem = chooser.selectedItem;
                await hideCmd(evt, this.plugin, selectedItem, chooser);
                modal.close();
                this.plugin.app.commands.executeCommandById("command-palette:open");
            }
        });
    }
    
    private registerHotkeyCommand(scope: any): void {
        scope.keys.push({
            key: "H",
            modifiers: "Ctrl",
            scope: scope.keys[0].scope,
            func: async (evt: KeyboardEvent) => {
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