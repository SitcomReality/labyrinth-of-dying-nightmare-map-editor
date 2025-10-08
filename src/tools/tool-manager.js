import { SelectTool } from './select-tool.js';
import { PlacementTool } from './placement-tool.js';
import { PickupTool } from './pickup-tool.js';
import { DeleteTool } from './delete-tool.js';
import { RotateTool } from './rotate-tool.js';
import { NoneTool } from './none-tool.js';
import { CopyTool } from './copy-tool.js';
import { ConnectorTool } from './connector-tool.js';

export class ToolManager {
    constructor(sceneManager, inputManager, mapManager, historyManager) {
        this.sceneManager = sceneManager;
        this.inputManager = inputManager;
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        
        this.tools = {
            none: new NoneTool(sceneManager, inputManager),
            select: new SelectTool(sceneManager, inputManager, mapManager),
            placement: new PlacementTool(sceneManager, inputManager, mapManager, historyManager),
            connector: new ConnectorTool(sceneManager, inputManager, mapManager, historyManager),
            pickup: null, // Will be initialized after
            delete: new DeleteTool(sceneManager, inputManager, mapManager, historyManager),
            rotate: new RotateTool(sceneManager, inputManager, mapManager, historyManager),
            copy: null, // Will be initialized after
        };
        
        // Initialize pickup tool with reference to tool manager
        this.tools.pickup = new PickupTool(sceneManager, inputManager, mapManager, historyManager, this);
        this.tools.copy = new CopyTool(sceneManager, inputManager, mapManager, historyManager, this);
        
        this.currentTool = this.tools.select;
        this.snapToGrid = false;
    }

    setTool(toolName) {
        if (this.currentTool) {
            this.currentTool.deactivate();
        }
        
        this.currentTool = this.tools[toolName];
        if (this.currentTool) {
            this.currentTool.activate();
        }
        window.dispatchEvent(new CustomEvent('toolChanged', { detail: { tool: toolName } }));
    }

    setSnapToGrid(enabled) {
        this.snapToGrid = enabled;
        Object.values(this.tools).forEach(tool => {
            if (tool.setSnapToGrid) {
                tool.setSnapToGrid(enabled);
            }
        });
    }

    handleMouseMove(event) {
        if (this.currentTool && this.currentTool.handleMouseMove) {
            this.currentTool.handleMouseMove(event);
        }
    }

    handleMouseDown(event) {
        if (this.currentTool && this.currentTool.handleMouseDown) {
            this.currentTool.handleMouseDown(event);
        }
    }

    handleMouseUp(event) {
        if (this.currentTool && this.currentTool.handleMouseUp) {
            this.currentTool.handleMouseUp(event);
        }
    }

    handleKeyDown(event) {
        if (this.currentTool && this.currentTool.handleKeyDown) {
            this.currentTool.handleKeyDown(event);
        }
    }

    handleKeyUp(event) {
        if (this.currentTool && this.currentTool.handleKeyUp) {
            this.currentTool.handleKeyUp(event);
        }
    }

    handleWheel(event) {
        if (this.currentTool && this.currentTool.handleWheel) {
            this.currentTool.handleWheel(event);
        }
    }

    update() {
        if (this.currentTool && this.currentTool.update) {
            this.currentTool.update();
        }
    }
}