import { PickupTool } from './pickup-tool.js';

export class CopyTool extends PickupTool {
    constructor(sceneManager, inputManager, mapManager, historyManager, toolManager) {
        super(sceneManager, inputManager, mapManager, historyManager, toolManager);
        this.highlightColor = 0x00e676; // Green for copy
        this.updateHighlightMaterial();
        this.shouldRemoveOriginal = false; // The only difference from PickupTool
    }
}

