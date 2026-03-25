import type RepeatLastCommands from "./main.ts";
import { getModalCmdVars } from "./cmd-utils.ts";
import { setupHoverPreview } from "./switcher.ts";

/**
 * Manages UI-related functionality for the plugin
 */
export class UIManager {
	private plugin: RepeatLastCommands;

	constructor(plugin: RepeatLastCommands) {
		this.plugin = plugin;
	}

	/**
	 * Adds information text below the command palette
	 */
	public addInfoToPalette(): void {
		const { modal } = getModalCmdVars(this.plugin);
		const instructions = modal.modalEl.querySelector(
			".prompt-instructions",
		) as HTMLElement;
		if (instructions && !instructions.querySelector(".palette-info")) {
			const shortcuts = [
				{ key: "ctrl+h", label: "edit hotkey" },
				{ key: "ctrl+-", label: "hide" },
				{ key: "ctrl++", label: "show" },
				{ key: "ctrl+p", label: "pin" },
				{ key: "ctrl+a", label: "alias" },
			];
			shortcuts.forEach(({ key, label }) => {
				const div = document.createElement("div");
				div.className = "prompt-instruction palette-info";
				div.innerHTML = `<span class="prompt-instruction-command" style="color: var(--interactive-accent) ; font-weight: bold;">${key}</span><span>${label}</span>`;
				instructions.prepend(div);
			});
		}
	}

	/**
	 * Adds information text and hover preview to the quick switcher
	 */
	public addInfoToSwitcher(modalEl: HTMLElement, switcherModal?: any): void {
		const instructions = modalEl.querySelector(
			".prompt-instructions",
		) as HTMLElement;
		if (instructions && !instructions.querySelector(".switcher-info")) {
			const infoDiv = document.createElement("div");
			infoDiv.className = "prompt-instruction switcher-info";
			infoDiv.innerHTML =
				'<span class="prompt-instruction-command" style="color: var(--interactive-accent); font-weight: bold;">ctrl+s</span><span>preview</span>';
			instructions.prepend(infoDiv);
		}

		if (switcherModal?.scope && !modalEl.dataset.hoverSetup) {
			modalEl.dataset.hoverSetup = "true";
			switcherModal.scope.register(["Ctrl"], "S", () => {
				setupHoverPreview(this.plugin, modalEl, switcherModal);
				return false;
			});
		}
	}
}
