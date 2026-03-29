import type { RLCSettings } from './global.d.ts';

export const DEFAULT_SETTINGS: RLCSettings = {
	maxLastCmds: 6,
	notify: true,
	aliases: {},
	userExcludedIDs: [],
	ifNoCmdOpenPalette: true,
	includeShortcuts: true,
	showCmdId: false,
	excludeCommands: []
};
