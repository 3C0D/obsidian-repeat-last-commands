import { TFile, SuggestModal } from 'obsidian';

export {};

declare module 'obsidian-typings' {
	interface CommandScope {
		keys: Array<{
			scope: any;
			modifiers: string | null;
			key: string;
			func: Function;
		}>;
		tabFocusContainerEl: HTMLElement;
	}

	interface QuickSwitcherItem {
		type: 'file' | unknown;
		file?: TFile;
	}

	interface SwitcherPluginInstance {
		modal: SuggestModal<QuickSwitcherItem>;
		QuickSwitcherModal: typeof SuggestModal<QuickSwitcherItem>;
	}
}

// Plugin settings and types
export interface RLCSettings {
	maxLastCmds: number;
	notify: boolean;
	aliases: Record<string, Record<string, string>>;
	userExcludedIDs: string[];
	ifNoCmdOpenPalette: boolean;
	includeShortcuts: boolean;
	showCmdId: boolean;
	excludeCommands: string[];
}

export type LastCommand = string[];
