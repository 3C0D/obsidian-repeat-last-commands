export interface RLCSettings {
    maxLastCmds: number;
    notify: boolean;
    aliases: Record<string, Record<string, string>>;
    userExcludedIDs: string[];
    ifNoCmdOpenPalette: boolean;
    includeShortcuts: boolean;
    showCmdId: boolean;
    excludeCommands: string[]
}

export type LastCommand = string[]

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

