export interface RLCSettings {
    aliases: Record<string, Record<string, string>>;
    showCmdId: boolean;
    excludeCommands: string[];
}

export type LastCommand = string[];

export const DEFAULT_SETTINGS: RLCSettings = {
    aliases: {},
    showCmdId: false,
    excludeCommands: []
};

