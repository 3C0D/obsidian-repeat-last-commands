import { PluginSettingTab, Setting } from "obsidian";
import type RepeatLastCommands from "./main.ts";
import { getCommandName } from "./cmd-utils.ts";

export class RLCSettingTab extends PluginSettingTab {
    constructor(public plugin: RepeatLastCommands) {
        super(plugin.app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Display aliases section
        if (this.plugin.settings.aliases && Object.keys(this.plugin.settings.aliases).length > 0) {
            containerEl.createEl('h3', { text: 'Command Aliases' });
            containerEl.createEl('p', {
                text: 'These commands have custom aliases. Remove them from this list to restore original names.'
            });

            const aliasesList = containerEl.createEl('div', { cls: 'aliases-list' });

            Object.entries(this.plugin.settings.aliases).forEach(([commandId, aliasDataRaw]) => {
                const aliasData = aliasDataRaw as { name: string };
                const originalName = aliasData.name.replace(/^\[.*?\]\s*/, '');

                new Setting(aliasesList)
                    .setName(aliasData.name)
                    .setDesc(`Original: ${originalName}`)
                    .addButton((button) => {
                        button
                            .setIcon('trash')
                            .setTooltip('Remove this alias')
                            .onClick(async () => {
                                // Remove the alias from settings
                                delete this.plugin.settings.aliases[commandId];

                                // Update the command name in the app
                                const command = this.plugin.app.commands.commands[commandId];
                                if (command) {
                                    command.name = originalName;
                                }

                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });
            });
        }

        // Display hidden commands section
        if (this.plugin.settings.excludeCommands && this.plugin.settings.excludeCommands.length > 0) {
            containerEl.createEl('h3', { text: 'Hidden Commands' });
            containerEl.createEl('p', {
                text: 'These commands have been hidden from the command palette. Remove them from this list to make them visible again.'
            });

            const hiddenCommandsList = containerEl.createEl('div', { cls: 'hidden-commands-list' });

            this.plugin.settings.excludeCommands.forEach((commandId: string) => {
                // Fix: Pass the plugin.app to getCommandName instead of using call
                const name = getCommandName(this.plugin.app, commandId);
                new Setting(hiddenCommandsList)
                    .setName(name)
                    .addButton((button) => {
                        button
                            .setIcon('trash')
                            .setTooltip('Unhide this command')
                            .onClick(async () => {
                                this.plugin.settings.excludeCommands = this.plugin.settings.excludeCommands.filter((id: string) => id !== commandId);
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });
            });
        }
    }
}