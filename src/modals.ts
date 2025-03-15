import { App, Modal, Scope, Setting, SuggestModal, TextComponent } from "obsidian";
import RepeatLastCommands from "./main";
import { getCommandIdsByNames, getCommandName, getConditions, getModalCmdVars } from "./cmd-utils";
import type { LastCommand } from "./types";

export class LastCommandsModal extends SuggestModal<LastCommand> {
    constructor(public plugin: RepeatLastCommands) {
        super(plugin.app);
    }

    getSuggestions(query: string): LastCommand[] {
        const { instance } = getModalCmdVars(this.plugin)
        // list of last command id used
        const lastCommands = instance.recentCommands;
        let lastCommandsArr = lastCommands.map(id => {
            try {
                const command = this.plugin.app.commands.commands[id];
                const name = command ? command.name : id;
                return [id, name];
            } catch (error) {
                return [id, id];
            }
        }).reverse();
        
        if (this.plugin.settings.includeCmdPaletteOPen) {
            lastCommandsArr = [...lastCommandsArr, ["command-palette:open", "Open Command Palette"]];
        }

        return lastCommandsArr.filter(cmd =>
            cmd[1].toLowerCase().includes(query.toLowerCase())
        );        
    }

    renderSuggestion(cmd: LastCommand, el: HTMLElement) {
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

    onChooseSuggestion(cmd: LastCommand) {
        const commandId = cmd[0];        
        // Execute the selected command directly
        this.plugin.app.commands.executeCommandById(commandId);        

        const { instance } = getModalCmdVars(this.plugin);        
        // Remove the command if it already exists in the list of recent commands
        const index = instance.recentCommands.indexOf(commandId);
        if (index > -1) {
            instance.recentCommands.splice(index, 1);
        }
        // Add the command at the end of the list
        instance.recentCommands.push(commandId);
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

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        const { chooser } = getConditions(this.plugin)
        let name = chooser.values[this.selectedItem].item.name
        this.titleEl.setText(`Define an alias`);
        contentEl.setText(`for: "${name}"`);

        // Create the input field
        const input = new TextComponent(contentEl)
            .setPlaceholder('Enter alias text here')
            .onChange(async (value) => {
                this.result = value;
            })
        const eL = input.inputEl
        eL.addClass('alias-input')
        eL.size = 42

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

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class ShowAgainCmds extends Modal {
    constructor(app: App, public plugin: RepeatLastCommands,
        public modal: any, public width?: number) {
        super(app);
        if (this.width) {
            this.modalEl.style.width = `${this.width}px`;
        }
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        const excluded = this.plugin.settings.excludeCommands
        let cmdNames: string[] = []
        for (const id of excluded) {
            cmdNames.push(getCommandName(this.plugin.app, id))
        }
        new Setting(contentEl)
            .setName("Excluded commands from command palette")
            .addTextArea((text) => {
                text
                    .setValue(cmdNames.join("\n"))
                text.inputEl.onblur = async () => {
                    const textArray = text.getValue() ? text.getValue().trim().split("\n") : []
                    const ids = getCommandIdsByNames(textArray)
                    this.plugin.settings.excludeCommands = ids
                    await this.plugin.saveSettings();
                    this.close()
                    this.modal.close()
                    this.plugin.app.commands.executeCommandById("command-palette:open")
                }
                text.inputEl.setAttr("rows", 4)
                text.inputEl.setAttr("cols", 40)
            })
    }
}

export async function hideCmd(plugin: RepeatLastCommands, selectedItem: number, chooser: any) {
    const id = chooser.values[selectedItem].item.id;

    if (!plugin.settings.excludeCommands.includes(id)) {
        plugin.settings.excludeCommands.push(id);
    }

    await plugin.saveSettings();
}