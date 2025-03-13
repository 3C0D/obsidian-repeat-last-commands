import type RepeatLastCommands from './main';
import { getModalCmdVars } from './cmd-utils';

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
        const existingInfoDiv = modal.modalEl.querySelector('.result-container-afterend');

        if (!existingInfoDiv) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'result-container-afterend';
            infoDiv.style.textAlign = 'center';
            infoDiv.textContent = "ctrl a: alias | crtl p: pin | ctrl -: hide | ctrl +: show | ctrl h: edit hotkey";
            resultContainerEl.insertAdjacentElement("afterend", infoDiv);
        }
    }
}