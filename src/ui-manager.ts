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
		const resultContainerEl = modal.resultContainerEl;
		const existingInfoDiv = modal.modalEl.querySelector(
			".result-container-afterend",
		);

		if (!existingInfoDiv) {
			const infoDiv = document.createElement("div");
			infoDiv.className = "result-container-afterend";
			infoDiv.style.textAlign = "center";
			infoDiv.innerHTML =
				"Ctrl+A: alias | Ctrl+P: pin | Ctrl+-: hide | Ctrl++: show | Ctrl+H: edit hotkey";
			resultContainerEl.insertAdjacentElement("afterend", infoDiv);
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
				'<span class="prompt-instruction-command" style="color: var(--color-green)">ctrl+s</span><span style="color: var(--color-green)">preview</span>';
			instructions.prepend(infoDiv);
		}

		if (switcherModal?.scope && !modalEl.dataset.hoverSetup) {
			modalEl.dataset.hoverSetup = "true";
			let isPreviewMode = false;

			switcherModal.scope.register(["Ctrl"], "S", () => {
				isPreviewMode = !isPreviewMode;
				if (isPreviewMode) {
					setupHoverPreview(
						this.plugin,
						modalEl,
						switcherModal,
						() => {
							isPreviewMode = false;
							delete modalEl.dataset.previewActive;
						},
					);
				} else {
					document.querySelector(".hover-popover")?.remove();
					delete modalEl.dataset.previewActive;
				}
				return false;
			});
		}
	}
}
