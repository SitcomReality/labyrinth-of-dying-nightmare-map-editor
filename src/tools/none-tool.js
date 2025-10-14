import { BaseTool } from './base-tool.js';

export class NoneTool extends BaseTool {
    constructor(sceneManager, inputManager) {
        super(sceneManager, inputManager);
    }

    handleMouseMove(event) {
        // Do nothing - no highlighting
    }

    handleMouseDown(event) {
        // Do nothing
    }

    handleMouseUp(event) {
        // Do nothing
    }

    deactivate() {
        // Do nothing
    }
}