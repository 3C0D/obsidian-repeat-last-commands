import { type Command } from 'obsidian';
import { around } from 'monkey-around';
import type RepeatLastCommands from './main.ts';
import { getModalCmdVars } from './cmd-utils.ts';
import { shouldExcludeCommand } from './palette.ts';

export function registerCommandFilter(plugin: RepeatLastCommands): () => void {
    const { settings } = plugin;

    return around(plugin.app.commands.constructor.prototype, {
        listCommands(old: () => Command[]): () => Command[] {
            return function (...args: unknown[]): Command[] {
                const commands: Command[] = old.call(this, ...args);

                // Filter excluded commands
                const filteredCommands = commands.filter((command) =>
                    !settings.excludeCommands.includes(command.id)
                );

                // Apply aliases to command names
                if (settings.aliases && Object.keys(settings.aliases).length > 0) {
                    filteredCommands.forEach(command => {
                        const alias = settings.aliases[command.id];
                        if (alias?.name) {
                            command.name = alias.name;
                        }
                    });
                }

                try {
                    const { instance } = getModalCmdVars(this);
                    // Filter out plugin commands and user excluded commands from recent commands 
                    if (instance.recentCommands) {
                        instance.recentCommands = instance.recentCommands.filter((id: string) =>
                            !shouldExcludeCommand(settings, id)
                        );
                    }
                } catch (error) {
                    console.debug('Command palette not available', error);
                }

                return filteredCommands;
            };
        }
    });
}