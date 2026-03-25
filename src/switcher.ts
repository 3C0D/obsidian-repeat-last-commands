import type RepeatLastCommands from "./main.ts";
// import type { SwitcherPlugin } from "obsidian-typings";
import { MarkdownView } from "obsidian";

export function setupHoverPreview(
	plugin: RepeatLastCommands,
	modalEl: HTMLElement,
	switcherModal: any,
	onClose?: () => void,
): void {
	if (modalEl.dataset.previewActive) {
		console.log("Preview already active for this modal");
		return};
	modalEl.dataset.previewActive = "true";

	const toggleAndShow = () => {
		showPreviewForSelected(plugin, modalEl, switcherModal);
	};
	toggleAndShow();

	// Ajoute le handler Escape dans le scope du modal
	const escHandler = {
		key: "Escape",
		modifiers: "",
		scope: switcherModal.scope.keys[0]?.scope,
		func: () => {
			const popover = document.querySelector(".hover-popover");
			if (popover) {
				popover.remove();
				switcherModal.scope.keys.splice(
					switcherModal.scope.keys.indexOf(escHandler),
					1,
				);
				delete modalEl.dataset.previewActive;
				onClose?.();
				return false;
			}
			return true;
		},
	};
	switcherModal.scope.keys.unshift(escHandler);

	modalEl.querySelectorAll<HTMLElement>(".suggestion-item").forEach((el) => {
		el.addEventListener("mouseover", (event: MouseEvent) => {
			const path = el
				.querySelector(".suggestion-title")
				?.textContent?.trim();
			if (!path) return;
			const file =
				plugin.app.vault.getAbstractFileByPath(path) ??
				plugin.app.metadataCache.getFirstLinkpathDest(path, "");
			if (file) {
				const activeView =
					plugin.app.workspace.getActiveViewOfType(MarkdownView);
				plugin.app.workspace.trigger("hover-link", {
					event,
					source: "switcher",
					hoverParent: activeView ?? switcherModal,
					targetEl: el,
					linktext: file.path,
					sourcePath: "",
				});
			}
		});
	});
}

function showPreviewForSelected(
	plugin: RepeatLastCommands,
	modalEl: HTMLElement,
	switcherModal: any,
): void {
	const selected = modalEl.querySelector<HTMLElement>(
		".suggestion-item.is-selected",
	);
	const path = selected
		?.querySelector(".suggestion-title")
		?.textContent?.trim();
	const file =
		plugin.app.vault.getAbstractFileByPath(path ?? "") ??
		plugin.app.metadataCache.getFirstLinkpathDest(path ?? "", "");
	if (file && selected) {
		const rect = selected.getBoundingClientRect();
		const event = new MouseEvent("mouseover", {
			bubbles: true,
			cancelable: true,
			clientX: rect.right,
			clientY: rect.top + rect.height / 2,
		});
		const activeView =
			plugin.app.workspace.getActiveViewOfType(MarkdownView);
		plugin.app.workspace.trigger("hover-link", {
			event,
			source: "switcher",
			hoverParent: activeView ?? {
				hoverPopover: null,
				containerEl: modalEl,
			},
			targetEl: selected,
			linktext: file.path,
			sourcePath: "",
		});

		// Ferme le popover existant pour le recréer
		const existing = document.querySelector(
			".hover-popover",
		) as HTMLElement;
		if (existing) {
			existing.remove();
		}

		// Attend l'apparition du nouveau popover
		const popoverObserver = new MutationObserver(() => {
			const popover = document.querySelector(
				".hover-popover",
			) as HTMLElement;
			if (popover) {
				popoverObserver.disconnect();
				setTimeout(() => {
					const popover = document.querySelector(
						".hover-popover",
					) as HTMLElement;
					if (!popover) return;
					const modalRect = modalEl.getBoundingClientRect();
					popover.style.position = "fixed";
					popover.style.left = `${modalRect.left + modalRect.width * 0.3}px`;
					popover.style.top = `${modalRect.top + modalRect.height * 0.5 - popover.offsetHeight * 0.5}px`;
					popover.style.zIndex = "9999";
				}, 0);
			}
		});
		popoverObserver.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}
}
