import { TFile, SuggestModal } from "obsidian";

export {};

declare module "obsidian-typings" {
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
		type: "file" | unknown;
		file?: TFile;
	}

	interface SwitcherPluginInstance {
		modal: SuggestModal<QuickSwitcherItem>;
		QuickSwitcherModal: typeof SuggestModal<QuickSwitcherItem>;
	}
}
