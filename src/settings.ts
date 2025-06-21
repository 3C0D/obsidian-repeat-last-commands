import { PluginSettingTab, Setting } from "obsidian";
import type RepeatLastCommands from "./main.ts";
import { getCommandName } from "./cmd-utils.ts";
import { AliasManagementModal } from "./modals.ts";

export class RLCSettingTab extends PluginSettingTab {
    constructor(public plugin: RepeatLastCommands) {
        super(plugin.app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h3", { text: "Repeat Last Commands Settings" });

        new Setting(containerEl)
            .setName("Number max of commands to show")
            .setDesc("Maximum number of recent commands to display in the modal")
            .addSlider((slider) => {
                slider
                    .setLimits(2, 30, 1)
                    .setValue(this.plugin.settings.maxLastCmds)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.maxLastCmds = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Show command id (2nd line)")
            .setDesc("Display the command ID below each command name")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.showCmdId)
                    .onChange(async (value) => {
                        this.plugin.settings.showCmdId = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Notify last command")
            .setDesc("Show notification when executing the last command")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.notify)
                    .onChange(async (value) => {
                        this.plugin.settings.notify = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("If no last command(s), then open command palette instead")
            .setDesc("Open command palette when no recent commands are available")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.ifNoCmdOpenCmdPalette)
                    .onChange(async (value) => {
                        this.plugin.settings.ifNoCmdOpenCmdPalette = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName("Include commands executed via shortcuts")
            .setDesc("Track commands executed via keyboard shortcuts and gestures (recommended)")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.includeShortcuts)
                    .onChange(async (value) => {
                        this.plugin.settings.includeShortcuts = value;
                        await this.plugin.saveSettings();
                    });
            });



        const fragment = new DocumentFragment();
        fragment.createDiv({}, div => {
            div.innerHTML = `ex: 'workspace:copy-path'<br>
        Use 'Copy last command id in clipboard', in command palette, to get last command id`;
        });

        new Setting(containerEl)
            .setName("Exclude commands from recent commands tracking (by ID)")
            .setDesc(fragment)
            .addTextArea((text) => {
                text
                    .setValue(this.plugin.settings.userExcludedIDs.join("\n"))
                    .onChange(async (value) => {
                        this.plugin.settings.userExcludedIDs = value.split("\n");
                        await this.plugin.saveSettings();
                    });
                text.inputEl.setAttr("rows", 4);
                text.inputEl.setAttr("cols", 50);
            });

        containerEl.createEl("h3", { text: "Command Palette Management" });

        new Setting(containerEl)
            .setName("Excluded commands from command palette")
            .setDesc("Enter command IDs (one per line) to hide them from the command palette. Use 'Copy last command id in clipboard' to get command IDs.")
            .addTextArea((text) => {
                const excluded = this.plugin.settings.excludeCommands;
                text.setValue(excluded.join("\n"));
                text.inputEl.onblur = async (): Promise<void> => {
                    const textArray = text.getValue() ? text.getValue().trim().split("\n").filter(id => id.length > 0) : [];
                    this.plugin.settings.excludeCommands = textArray;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show updated hidden commands list
                };
                text.inputEl.setAttr("rows", 4);
                text.inputEl.setAttr("cols", 50);
            });

        // Aliases management button
        new Setting(containerEl)
            .setName("Manage Command Aliases")
            .setDesc("Open a modal to view and manage command aliases")
            .addButton((button) => {
                button
                    .setButtonText("Manage Aliases")
                    .onClick(() => {
                        new AliasManagementModal(this.plugin.app, this.plugin).open();
                    });
            });

        // Display hidden commands section
        if (this.plugin.settings.excludeCommands && this.plugin.settings.excludeCommands.length > 0) {
            containerEl.createEl('h3', { text: 'Hidden Commands' });
            containerEl.createEl('p', {
                text: 'These commands have been hidden from the command palette. Remove them from this list to make them visible again. '
            });

            const hiddenCommandsList = containerEl.createEl('div', { cls: 'hidden-commands-list' });

            this.plugin.settings.excludeCommands.forEach((commandId: string) => {
                // Fix: Pass the plugin.app to getCommandName instead of using call
                const commandName = getCommandName(this.plugin.app, commandId);

                new Setting(hiddenCommandsList)
                    .setName(commandName || commandId)
                    .addButton((button) => {
                        button
                            .setIcon('trash')
                            .setTooltip('Restore this command')
                            .onClick(async () => {
                                this.plugin.settings.excludeCommands = this.plugin.settings.excludeCommands.filter(
                                    (id: string) => id !== commandId
                                );
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });
            });
        }
    }
}