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

export interface CommandScope {
    keys: Array<{
        scope: any;
        modifiers: string | null;
        key: string;
        func: Function;
    }>;
    tabFocusContainerEl: HTMLElement;
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
        addMessage: (e: any) => void;
        addSuggestion: (e: any) => void;
        forceSetSelectedItem: (e: any, t?: any) => void;
        onSuggestionClick: (e: any, t: any) => void;
        onSuggestionMouseover: (e: any, t: any) => void;
        pageDown: (e: any) => void;
        pageUp: (e: any) => void;
        setSelectedItem: (e: any, t?: any) => void;
        setSuggestions: (e: any) => void;
        useSelectedItem: (e: any) => void;
        numVisibleItems: number;
        rowHeight: number;
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
    scope: CommandScope;
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
