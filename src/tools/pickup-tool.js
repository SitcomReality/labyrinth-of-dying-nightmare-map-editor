import { BaseTool } from './base-tool.js';

export class PickupTool extends BaseTool {
    constructor(sceneManager, inputManager, mapManager, historyManager, toolManager) {
        super(sceneManager, inputManager);
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        this.toolManager = toolManager;
        this.highlightColor = 0x9d4aff;
        this.updateHighlightMaterial();
        this.shouldRemoveOriginal = true;
    }

    handleMouseMove(event) {
        this.updateMousePosition(event);
        const intersects = this.raycast();
        if (intersects.length > 0) this.highlightObject(intersects[0].object);
        else this.clearHighlight();
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;
        this.updateMousePosition(event);
        const intersects = this.raycast();
        if (intersects.length > 0) this.pickupObject(intersects[0].object);
    }

    pickupObject(object) {
        // Resolve to top-level object container
        if (object.userData && (object.userData.isLightSprite || object.userData.isTextSprite || object.userData.isLightHelper || object.userData.isShapeSprite || object.userData.isConnectorSprite)) object = object.parent;
        while (object.parent && object.parent !== this.sceneManager.scene) object = object.parent;

        const mapObject = this.mapManager.objects.find(o => {
            const container = (o.type === 'light' || o.type === 'text' || o.type === 'shape' || o.type === 'connector') ? o.object.container : o.object;
            return container === object;
        });

        if (mapObject) {
            const placementTool = this.toolManager.tools.placement;
            
            // Create a properties object to pass to the placement tool
            const properties = {
                position: object.position.clone(),
                rotation: object.rotation.clone(),
                name: mapObject.name,
            };

            let assetModel;
            if (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape' || mapObject.type === 'connector') {
                properties.config = mapObject.object.config;
                assetModel = { type: mapObject.type, config: properties.config, name: properties.name };
            } else {
                assetModel = object;
            }

            if (this.shouldRemoveOriginal) {
                const mapObjToRemove = (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape' || mapObject.type === 'connector') ? mapObject.object : object;
                placementTool.originalState = {
                    mapObject: mapObject,
                    originalObject: mapObjToRemove, // store actual Three/Object reference removed from scene
                    position: (mapObject.position ? mapObject.position.clone() : (mapObjToRemove?.position?.clone?.() || object.position.clone())),
                    rotation: (mapObject.rotation ? mapObject.rotation.clone() : (mapObjToRemove?.rotation?.clone?.() || object.rotation.clone()))
                };
                this.mapManager.removeObject(mapObjToRemove);
            }

            placementTool.setPickedUpAsset(mapObject.assetName, assetModel, properties);
            this.toolManager.setTool('placement');
        }
    }

    deactivate() {
        this.clearHighlight();
    }
}