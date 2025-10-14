import { PlacementTool } from './placement-tool.js';

// ConnectorTool is a specialized version of PlacementTool
// It locks rotation and some other features to simplify placing connection points.
export class ConnectorTool extends PlacementTool {
    constructor(sceneManager, inputManager, mapManager, historyManager) {
        super(sceneManager, inputManager, mapManager, historyManager);
    }

    // Override mouse down to place immediately on click, no dragging for rotation.
    handleMouseDown(event) {
        if (event.button === 0 && this.ghostObject) {
            this.placeObject();
        } else if (event.button === 2) {
            this.cancel();
        }
    }

    // Disable dragging for rotation
    handleMouseUp(event) {}

    // No rotation for connectors via this tool
    handleRotationDrag(event) {}

    // No height adjustment for connectors
    handleWheel(event) {}
}