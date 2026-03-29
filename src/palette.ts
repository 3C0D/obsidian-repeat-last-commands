import type { Command } from 'obsidian';
import type RepeatLastCommands from './main.ts';
import { around } from 'monkey-around';
import type { RLCSettings } from './global.d.ts';
import { getModalCmdVars } from './cmd-utils.ts';

export function onCommandTrigger(plugin: RepeatLastCommands): any {
	return around(plugin.app.commands, {
		executeCommand(originalMethod) {
			return function (this: any, command: Command, event?: Event) {
				const commandId = command.id;

				if (commandId === 'command-palette:open') {
					plugin.uiManager.addInfoToPalette();
				}

				if (commandId === 'switcher:open') {
					const observer = new MutationObserver((_, obs) => {
						const modalEl = document.querySelector(
							'.modal-container .prompt'
						) as HTMLElement;
						if (modalEl) {
							obs.disconnect();
							const switcher =
								plugin.app.internalPlugins.getPluginById('switcher');
							const activeModal = (switcher as any)?.instance?.activeModal;
							plugin.uiManager.addInfoToSwitcher(modalEl, activeModal);
						}
					});
					observer.observe(document.body, {
						childList: true,
						subtree: true
					});
				}

				const result =
					originalMethod && originalMethod.call(this, command, event);

				// Track commands executed via shortcuts if setting is enabled
				if (
					plugin.settings.includeShortcuts &&
					!shouldExcludeCommand(plugin.settings, commandId)
				) {
					try {
						const { instance } = getModalCmdVars(plugin);
						// Remove if already exists
						const index = instance.recentCommands.indexOf(commandId);
						if (index > -1) {
							instance.recentCommands.splice(index, 1);
						}
						// Add at the beginning (most recent)
						instance.recentCommands.unshift(commandId);

						// Limit the size of recent commands
						if (instance.recentCommands.length > 50) {
							instance.recentCommands = instance.recentCommands.slice(
								0,
								50
							);
						}
					} catch {
						// Ignore errors if command palette is not available
					}
				}

				return result;
			};
		}
	});
}

export function shouldExcludeCommand(settings: RLCSettings, commandId: string): boolean {
	return (
		commandId === 'repeat-last-commands:repeat-last-command' ||
		commandId === 'repeat-last-commands:repeat-commands' ||
		commandId === 'repeat-last-commands:get-last-command' ||
		commandId === 'command-palette:open' ||
		settings.excludeCommands.includes(commandId) ||
		settings.userExcludedIDs.some(
			(excludedId: string) =>
				commandId === excludedId || commandId.startsWith(excludedId)
		)
	);
}
