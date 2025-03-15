export interface RLCSettings {
    aliases: Record<string, Record<string, string>>;
    includeCmdPaletteOPen: boolean;
    showCmdId: boolean;
    excludeCommands: string[]
}

export type LastCommand = string[]

export const DEFAULT_SETTINGS: RLCSettings = {
    aliases: {},
    includeCmdPaletteOPen: false,
    showCmdId: false,
    excludeCommands: []
}

