import * as THREE from 'three';
import { disposeGhost } from './ghost-factory.js';

export async function placeObject() {
    if (!this.ghostObject) return;
    
    const ghostContainer = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset) ? this.ghostObject.container : this.ghostObject;
    
    if (!ghostContainer.visible) {
        console.warn('Cannot place object outside of positive X and Z quadrant.');
        return;
    }
    
    let placed;
    let placedContainer;
    const props = this.pickedUpProperties || {};
    
    if (this.isLightAsset) {
        const { LightObject } = await import('../../lights/light-object.js');
        const config = props.config || this.ghostObject.config;
        placed = new LightObject(config, props.name || this.ghostObject.name);
        placedContainer = placed.container;
        window.app?.lightController?.addLight(placed);
    } else if (this.isTextAsset) {
        const { TextObject } = await import('../../text/text-object.js');
        const config = props.config || this.ghostObject.config;
        placed = new TextObject(config, props.name || this.ghostObject.name);
        placedContainer = placed.container;
        window.app?.textController?.addText(placed);
    } else if (this.isShapeAsset) {
        const { ShapeObject } = await import('../../shapes/shape-object.js');
        const config = props.config || this.ghostObject.config;
        placed = new ShapeObject(config, props.name || this.ghostObject.name);
        placedContainer = placed.container;
        window.app?.shapeController?.addShape(placed);
    } else if (this.isConnectorAsset) {
        const { ConnectorObject } = await import('../../connectors/connector-object.js');
        const config = props.config || this.ghostObject.config;
        placed = new ConnectorObject(config, props.name || this.ghostObject.name);
        placedContainer = placed.container;
        window.app?.connectorController?.addConnector(placed);
    } else if (this.isNpcAsset) {
        const { NPCObject } = await import('../../npc/npc-object.js');
        const config = props.config || this.ghostObject.config;
        placed = new NPCObject(config, props.name || this.ghostObject.name);
        placedContainer = placed.container;
        window.app?.npcController?.addNPC(placed);
    } else {
        placed = this.ghostObject.clone();
        placedContainer = placed;
        placed.traverse((node) => {
            if (node.isMesh) {
                if (node.userData && node.userData.originalMaterial) {
                    delete node.userData.originalMaterial;
                }
                const m = node.material;
                if (Array.isArray(m)) {
                    node.material = m.map(mat => {
                        const c = mat && mat.clone ? mat.clone() : mat;
                        if (c) { c.transparent = false; c.opacity = 1; }
                        return c;
                    });
                } else if (m) {
                    const cloned = m && m.clone ? m.clone() : m;
                    if (cloned) { cloned.transparent = false; cloned.opacity = 1; }
                    node.material = cloned;
                }
            }
        });
    }
    
    if (placedContainer) {
        placedContainer.position.copy(ghostContainer.position);
        placedContainer.rotation.copy(ghostContainer.rotation);
        placedContainer.scale.copy(ghostContainer.scale);
    }
    
    const mapObject = this.mapManager.addObject(this.assetName, placed);
    if(props.name) mapObject.name = props.name;
    
    try {
        const lowerName = (this.assetName || '').toLowerCase();
        if (lowerName.startsWith('floor')) {
            mapObject.components = mapObject.components || {};
            mapObject.components.Navigation = { isWalkable: true, isNavigable: true };
            this.mapManager.updateObjectProperties(mapObject, { components: mapObject.components });
        }
    } catch (e) {
        console.warn('Failed to assign default Navigation component to floor asset', e);
    }
    
    window.app?.uiManager?.assetPanel?.state?.addRecentlyUsed(this.assetName);
    this.historyManager.recordAction('place', { mapObject });
    this.startRotation = this.rotation;
    this.placementPlaneHeight = placedContainer.position.y;
    this.updatePlacementPlane();
    
    if (this.paintMode && this.isFromPickup) {
    } else if (this.paintMode) {
        this.heightOffset = 0;
    } else {
        window.app?.toolManager?.setTool('none');
    }
}

export function cancel() {
    if (this.originalState) {
        const originalMapObject = this.originalState.mapObject;
        let containerToRestore = null;

        try {
            if (this.originalState.originalObject) {
                this.mapManager.addObjectDirect({
                    ...originalMapObject,
                    object: this.originalState.originalObject
                });
                containerToRestore = this.originalState.originalObject.container || this.originalState.originalObject;
            } else {
                this.mapManager.addObjectDirect(originalMapObject);
                containerToRestore = originalMapObject.object.container || originalMapObject.object;
            }

            if (containerToRestore) {
                if (containerToRestore.position && containerToRestore.rotation) {
                    containerToRestore.position.copy(this.originalState.position);
                    containerToRestore.rotation.copy(this.originalState.rotation);
                }
                if (containerToRestore.scale) {
                    containerToRestore.scale.set(originalMapObject.scaleX ?? 1, 1, originalMapObject.scaleZ ?? 1);
                }
            }
        } catch (err) {
            console.warn('Failed to restore original object during cancel:', err);
        }
        window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
        this.originalState = null;
    }
    this.clearGhost();
    window.app?.toolManager?.setTool('none');
}

