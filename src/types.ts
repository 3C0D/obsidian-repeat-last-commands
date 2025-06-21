export interface RLCSettings {
    maxLastCmds: number;
    notify: boolean;
    aliases: Record<string, Record<string, string>>;
    sort: boolean;
    userExcludedIDs: string[];
    ifNoCmdOpenCmdPalette: boolean;
    includeCmdPaletteOPen: boolean;
    showCmdId: boolean;
    excludeCommands: string[];
}

export type LastCommand = [string, string];

export const DEFAULT_SETTINGS: RLCSettings = {
    maxLastCmds: 4,
    notify: true,
    aliases: {},
    sort: true,
    userExcludedIDs: [],
    ifNoCmdOpenCmdPalette: true,
    includeCmdPaletteOPen: false,
    showCmdId: false,
    excludeCommands: []
};

