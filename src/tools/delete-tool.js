import { BaseTool } from './base-tool.js';

export class DeleteTool extends BaseTool {
    constructor(sceneManager, inputManager, mapManager, historyManager) {
        super(sceneManager, inputManager);
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        // Override highlight color for delete tool
        this.highlightColor = 0xff4a4a; // Red
        this.updateHighlightMaterial();
    }

    handleMouseMove(event) {
        this.updateMousePosition(event);
        const intersects = this.raycast();
        
        if (intersects.length > 0) {
            this.highlightObject(intersects[0].object);
        } else {
            this.clearHighlight();
        }
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;
        
        this.updateMousePosition(event);
        const intersects = this.raycast();
        
        if (intersects.length > 0) {
            let object = intersects[0].object;
            
            // Check if it's a light sprite, text sprite, or helper - get parent container
            if (object.userData && (object.userData.isLightSprite || object.userData.isTextSprite || object.userData.isLightHelper || object.userData.isShapeSprite)) {
                object = object.parent;
            }
            
            while (object.parent && object.parent !== this.sceneManager.scene) {
                object = object.parent;
            }
            
            const mapObject = this.mapManager.objects.find(o => {
                if (o.type === 'light' || o.type === 'text' || o.type === 'shape') {
                    return o.object.container === object;
                }
                return o.object === object;
            });
            
            if (mapObject) {
                this.historyManager.recordAction('delete', { mapObject });
                if (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape') {
                    this.mapManager.removeObject(mapObject.object);
                } else {
                    this.mapManager.removeObject(object);
                }
            }
        }
    }

    deactivate() {
        this.clearHighlight();
    }
}