export interface RLCSettings {
    maxLastCmds: number;
    notify: boolean;
    aliases: Record<string, Record<string, string>>;
    sort: boolean;
    userExcludedIDs: string[];
    ifNoCmdOpenCmdPalette: boolean;
    includeCmdPaletteOPen: boolean;
    showCmdId: boolean;
    excludeCommands: string[]
}

export type LastCommand = [string, string][]

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
}

export interface CommandPaletteModal {
    chooser: {
        values: Array<{
            item: {
                id: string;
                name: string;
                icon?: string;
            };
            match: {
                score: number;
                matches: any[];
            };
        }>;
        containerEl: HTMLElement;
        moveDown: (count: number) => void;
        moveUp: (count: number) => void;
        selectedItem: number;
        suggestions: Array<HTMLElement & {
            className: string;
            isSelected?: boolean;
        }>;
    };
    resultContainerEl: HTMLElement;
    bgEl: HTMLDivElement;
    bgOpacity: string;
    win: boolean;
    modalEl: HTMLDivElement;
    updateSuggestions: () => Promise<void>;
    close: () => void;
    onClose: () => void;
    app: any;
    selection: {
        focusEl: HTMLElement;
        range: Range;
        win: Window;
        shouldAnimate: boolean;
        shouldRestoreSelection: boolean;
    };
    scope: {
        keys: Array<{
            scope: any;
            modifiers: string | null;
            key: string;
            func: Function;
        }>;
        tabFocusContainerEl: HTMLElement;
    };
}

export interface CommandPaletteInstance {
    modal: CommandPaletteModal;
    options: {
        pinned: string[];
    };
    saveSettings: (plugin: CommandPalette) => void;
    recentCommands: string[];
}

export interface CommandPalette {
    instance: CommandPaletteInstance;
}