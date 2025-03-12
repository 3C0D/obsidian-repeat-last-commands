import RepeatLastCommands from "./main"

export function getConditions(plugin: RepeatLastCommands) {
    const { modal } = getModalCmdVars(plugin)
    const chooser = modal.chooser
    // Console.debug("chooser", chooser) // important to see structure and add icons? status bar
    const values = chooser.values// id, name, icon
    const { aliases } = plugin.settings
    return { values, aliases, chooser }
}

export function getModalCmdVars(plugin: RepeatLastCommands) {
    const cmdPalette = getCmdPalette(plugin)
    const instance = cmdPalette.instance
    const modal = instance.modal
    return { modal, instance, cmdPalette }
}

export function getCmdPalette(plugin: RepeatLastCommands) {
    return plugin.app.internalPlugins.getPluginById("command-palette")
}

export function aliasify(values: any, aliases: any) {
    values.map(async (value: any) => {
        if (value.item.id in aliases) {
            value.item.name = aliases[value.item.id].name
        }
    })
}

export function getBackSelection(chooser: any, selectedItem: number) {
    for (let i = 1; i <= selectedItem; i++) {
        try {
            if (selectedItem)
                chooser.moveDown(1)
        } catch (err) {
            const dd = "I don't care this error, job is done"
        }
    }

    // if (selectedItem === 0) chooser.selectedItem = chooser.values.length - 1
    // else chooser.selectedItem = selectedItem - 1
}

export function getCommandName(id: string) {
    const command = this.app.commands.findCommand(id);
    command.name.startsWith("*") ? command.name = command.name.substring(1) : null
    return command.name;
}

export function getCommandIds(names: string[]) {
    const ids: string[] = []
    for (const key in this.app.commands.commands) {
        const command = this.app.commands.commands[key];
        if (names.includes(command.name)) {
            ids.push(command.id)
        }
    }
    return ids;
}