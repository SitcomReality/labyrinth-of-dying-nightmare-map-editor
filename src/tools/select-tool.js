import { BaseTool } from './base-tool.js';

export class SelectTool extends BaseTool {
    constructor(sceneManager, inputManager, mapManager) {
        super(sceneManager, inputManager);
        this.mapManager = mapManager;
        this.selectedObject = null;
        // Override highlight color for select tool
        this.highlightColor = 0x4a9eff; // Blue
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
            this.selectObject(intersects[0].object);
        } else {
            this.deselectObject();
        }
    }

    selectObject(object) {
        this.deselectObject();

        // Check if it's a light sprite, text sprite, or helper - get parent container
        if (object.userData && (object.userData.isLightSprite || object.userData.isTextSprite || object.userData.isLightHelper || object.userData.isShapeSprite || object.userData.isConnectorSprite)) {
            object = object.parent;
        }

        while (object.parent && object.parent !== this.sceneManager.scene) {
            object = object.parent;
        }

        this.selectedObject = object;
        const mapObject = this.mapManager.objects.find(o => {
            if (o.type === 'light' || o.type === 'text' || o.type === 'shape' || o.type === 'connector' || o.type === 'npc') {
                return o.object.container === object;
            }
            return o.object === object;
        });

        if (mapObject) {
            // Show light helper if it's a light
            if (mapObject.type === 'light') {
                window.app?.lightController?.showHelpers(mapObject.object);
            }
            window.dispatchEvent(new CustomEvent('objectSelected', { detail: mapObject }));
        }
    }

    deselectObject() {
        if (this.selectedObject) {
            window.app?.lightController?.hideHelpers();
            this.selectedObject = null;
            window.dispatchEvent(new CustomEvent('objectDeselected'));
        }
    }

    deactivate() {
        this.clearHighlight();
        this.deselectObject();
    }
}