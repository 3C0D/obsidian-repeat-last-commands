import type RepeatLastCommands from './main.ts';
import { MarkdownView } from 'obsidian';

export function setupHoverPreview(
	plugin: RepeatLastCommands,
	modalEl: HTMLElement,
	switcherModal: any
): void {
	showPreviewForSelected(plugin, modalEl, switcherModal);

	modalEl.querySelectorAll<HTMLElement>('.suggestion-item').forEach((el) => {
		el.addEventListener('mouseover', (event: MouseEvent) => {
			if (!modalEl.dataset.previewActive) return;
			const path = el.querySelector('.suggestion-title')?.textContent?.trim();
			if (!path) return;
			const file =
				plugin.app.vault.getAbstractFileByPath(path) ??
				plugin.app.metadataCache.getFirstLinkpathDest(path, '');
			if (!file) return;
			const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			plugin.app.workspace.trigger('hover-link', {
				event,
				source: 'switcher',
				hoverParent: activeView ?? switcherModal,
				targetEl: el,
				linktext: file.path,
				sourcePath: ''
			});
		});
	});
}

function showPreviewForSelected(
	plugin: RepeatLastCommands,
	modalEl: HTMLElement,
	switcherModal: any
): void {
	const selected = modalEl.querySelector<HTMLElement>('.suggestion-item.is-selected');
	const path = selected?.querySelector('.suggestion-title')?.textContent?.trim();
	if (!path || !selected) return;
	const file =
		plugin.app.vault.getAbstractFileByPath(path) ??
		plugin.app.metadataCache.getFirstLinkpathDest(path, '');
	if (!file) return;
	const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
	const rect = selected.getBoundingClientRect();
	const event = new MouseEvent('mouseover', {
		bubbles: true,
		cancelable: true,
		clientX: rect.right,
		clientY: rect.top + rect.height / 2
	});
	plugin.app.workspace.trigger('hover-link', {
		event,
		source: 'switcher',
		hoverParent: activeView ?? switcherModal,
		targetEl: selected,
		linktext: file.path,
		sourcePath: ''
	});

	// Force recreation of popover
	document.querySelector('.hover-popover')?.remove();

	const popoverObserver = new MutationObserver(() => {
		const popover = document.querySelector('.hover-popover') as HTMLElement;
		if (popover) {
			clearTimeout(safetyTimeout);
			popoverObserver.disconnect();
			setTimeout(() => {
				const p = document.querySelector('.hover-popover') as HTMLElement;
				if (!p) return;
				const modalRect = modalEl.getBoundingClientRect();
				p.style.position = 'fixed';
				p.style.left = `${modalRect.left + modalRect.width * 0.3}px`;
				p.style.top = `${modalRect.top + modalRect.height * 0.5 - p.offsetHeight * 0.5}px`;
				p.style.zIndex = '9999';
			}, 50);
		}
	});
	popoverObserver.observe(document.body, { childList: true, subtree: true });

	// Safety timeout to disconnect observer if popover never appears
	const safetyTimeout = setTimeout(() => popoverObserver.disconnect(), 3000);
}
