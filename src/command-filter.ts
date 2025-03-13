import { type Command } from 'obsidian';
import { around } from 'monkey-around';
import type RepeatLastCommands from './main';
import { getModalCmdVars } from './cmd-utils';
import { shouldExcludeCommand } from './palette';

export function registerCommandFilter(plugin: RepeatLastCommands) {
    const { settings } = plugin;
    
    return around(plugin.app.commands.constructor.prototype, {
        listCommands(old) {
            return function (...args: any[]) {
                const commands: Command[] = old.call(this, ...args);

                // Filter excluded commands
                const filteredCommands = commands.filter((command) => 
                    !settings.excludeCommands.includes(command.id)
                );

                // Apply aliases to command names
                if (settings.aliases) {
                    filteredCommands.forEach(command => {
                        if (settings.aliases[command.id] && settings.aliases[command.id].name) {
                            command.name = settings.aliases[command.id].name;
                        }
                    });
                }

                const { instance } = getModalCmdVars(this);

                // Filter out plugin commands and user excluded commands from recent commands
                instance.recentCommands = instance.recentCommands.filter(id => {
                    return !shouldExcludeCommand(settings, id);
                });

                return filteredCommands;
            };
        }
    });
}