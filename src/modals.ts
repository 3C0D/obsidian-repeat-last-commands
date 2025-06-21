import { App, Modal, Scope, Setting, SuggestModal, TextComponent } from "obsidian";
import RepeatLastCommands from "./main.ts";
import { getConditions, getModalCmdVars, getCommandName } from "./cmd-utils.ts";
import type { LastCommand } from "./types.ts";

export class LastCommandsModal extends SuggestModal<LastCommand> {
    constructor(public plugin: RepeatLastCommands) {
        super(plugin.app);
    }

    getSuggestions(query: string): LastCommand[] {
        const { instance } = getModalCmdVars(this.plugin);
        // list of last command id used
        const lastCommands = instance.recentCommands;

        // Take the first N commands (most recent are at the beginning)
        const recentCommands = lastCommands.slice(0, this.plugin.settings.maxLastCmds);

        let lastCommandsArr = recentCommands.map((id: string) => {
            try {
                const command = this.plugin.app.commands.commands[id];
                const name = command ? command.name : id;
                return [id, name];
            } catch {
                return [id, id];
            }
        });

        return lastCommandsArr.filter((cmd: string[]) =>
            cmd[1].toLowerCase().includes(query.toLowerCase())
        );
    }

    renderSuggestion(cmd: LastCommand, el: HTMLElement): void {
        if (cmd[1].includes(":")) {
            const [name, command] = cmd[1].toString().split(":");
            el.createEl("div", {
                cls: "cmd-suggest",
            }, (cont) => {
                cont.createEl("span", { text: `${name}:`, cls: "cmd-suggest-name" });
                cont.createEl("span", { text: `${command}`, cls: "cmd-suggest-cmd" });
            });
        } else {
            el.createEl("div", { text: `${cmd[1]}`, cls: "cmd-alone" });
        }

        if (this.plugin.settings.showCmdId)
            el.createEl("div", { text: `${cmd[0]}`, cls: "id-suggest" });
    }

    onChooseSuggestion(cmd: LastCommand): void {
        const commandId = cmd[0];
        // Execute the selected command directly
        this.plugin.app.commands.executeCommandById(commandId);

        const { instance } = getModalCmdVars(this.plugin);
        // Remove the command if it already exists in the list of recent commands
        const index = instance.recentCommands.indexOf(commandId);
        if (index > -1) {
            instance.recentCommands.splice(index, 1);
        }
        // Add the command at the beginning of the list (most recent)
        instance.recentCommands.unshift(commandId);
    }
}

export class AliasModal extends Modal {
    result: string;
    constructor(app: App, public plugin: RepeatLastCommands,
        public selectedItem: number, public onSubmit: (result: string) => void, public width?: number) {
        super(app);
        this.scope = new Scope(this.scope);
        this.scope.register([], "Enter", () => {
            this.close();
            this.onSubmit(this.result);
        });
        if (this.width) {
            this.modalEl.style.width = `${this.width}px`;
        }
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        const { chooser } = getConditions(this.plugin);
        let name = "";
        if (chooser.values && chooser.values[this.selectedItem]) {
            name = chooser.values[this.selectedItem].item.name;
        }
        this.titleEl.setText(`Define an alias`);
        contentEl.setText(`for: "${name}"`);

        // Create the input field
        const input = new TextComponent(contentEl)
            .setPlaceholder('Enter alias text here')
            .onChange(async (value) => {
                this.result = value;
            });
        const eL = input.inputEl;
        eL.addClass('alias-input');
        eL.size = 42;

        // Add a more visually integrated help text
        contentEl.createEl('div', {
            text: '(To remove the alias, submit an empty field)',
            cls: 'alias-note',
            attr: {
                style: 'font-size: 0.8em; color: var(--text-muted); margin-top: 4px; text-align: end; margin-right: 70px'
            }
        });

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Submit")
                    .setCta()
                    .onClick(() => {
                        this.onSubmit(this.result);
                        this.close();
                    }));
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}



export class AliasManagementModal extends Modal {
    constructor(app: App, public plugin: RepeatLastCommands) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        this.titleEl.setText("Manage Command Aliases");

        if (this.plugin.settings.aliases && Object.keys(this.plugin.settings.aliases).length > 0) {
            contentEl.createEl('p', {
                text: 'These commands have custom aliases. Remove them to restore original names.'
            });

            Object.entries(this.plugin.settings.aliases).forEach(([commandId, aliasData]) => {
                const originalName = aliasData.name.replace(/^\[.*?\]\s*/, '');

                new Setting(contentEl)
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
                                this.onOpen(); // Refresh the modal
                            });
                    });
            });
        } else {
            contentEl.createEl('p', {
                text: 'No aliases have been created yet. You can create aliases from the command palette using the "Define alias" option.'
            });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class ExcludedCommandsModal extends Modal {
    private hasChanges = false;

    constructor(app: App, public plugin: RepeatLastCommands, public paletteModal?: any) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        this.titleEl.setText("Manage Hidden Commands");

        if (this.plugin.settings.excludeCommands && this.plugin.settings.excludeCommands.length > 0) {
            contentEl.createEl('p', {
                text: 'These commands have been hidden from the command palette. Click the restore button to make them visible again.'
            });

            this.plugin.settings.excludeCommands.forEach((commandId: string) => {
                const commandName = getCommandName(this.plugin.app, commandId);

                new Setting(contentEl)
                    .setName(commandName || commandId)
                    .setDesc(`ID: ${commandId}`)
                    .addButton((button) => {
                        button
                            .setIcon('eye')
                            .setTooltip('Restore this command')
                            .onClick(async () => {
                                // Remove the command from excluded list
                                this.plugin.settings.excludeCommands = this.plugin.settings.excludeCommands.filter(
                                    (id: string) => id !== commandId
                                );
                                await this.plugin.saveSettings();
                                this.hasChanges = true; // Mark that changes were made
                                this.onOpen(); // Refresh the modal
                            });
                    });
            });
        } else {
            contentEl.createEl('p', {
                text: 'No commands have been hidden yet.'
            });
        }
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();

        // If changes were made and we have a palette modal, refresh it
        if (this.hasChanges && this.paletteModal) {
            this.paletteModal.close();
            this.plugin.app.commands.executeCommandById("command-palette:open");
        }
    }
}

export async function hideCmd(plugin: RepeatLastCommands, selectedItem: number, chooser: any): Promise<void> {
    const id = chooser.values[selectedItem].item.id;

    if (!plugin.settings.excludeCommands.includes(id)) {
        plugin.settings.excludeCommands.push(id);
    }

    await plugin.saveSettings();
}