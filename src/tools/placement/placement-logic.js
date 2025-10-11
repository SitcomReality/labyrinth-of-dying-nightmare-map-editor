import { createGhost, disposeGhost } from './ghost-factory.js';
import * as THREE from 'three';

export async function setAsset(name, model) {
    this.clearGhost();
    this.assetName = name;
    this.state.heightOffset = 0;
    
    const { ghost, isLight, isText, isShape, isConnector } = await createGhost(model, this.sceneManager);
    this.ghostObject = ghost; 
    this.isLightAsset = isLight; 
    this.isTextAsset = isText;
    this.isShapeAsset = isShape;
    this.isConnectorAsset = !!isConnector;
    this.isNpcAsset = model?.type === 'npc';
    
    // Ensure NPCs are treated like other special assets (use .container for size/bounds)
    const container = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset) ? this.ghostObject.container : this.ghostObject;
    
    if (this.pickedUpProperties) {
        container.position.copy(this.pickedUpProperties.position);
        container.rotation.copy(this.pickedUpProperties.rotation);
        this.rotation = this.pickedUpProperties.rotation.y;
    } else {
        this.rotation = 0;
    }
    
    this.assetSize.copy(new THREE.Box3().setFromObject(container).getSize(new THREE.Vector3()));
}

export async function placeObject() {
    if (!this.ghostObject) return;
    
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
                // Remove any leftover highlight bookkeeping from earlier tools
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
    
    const ghostContainer = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset) ? this.ghostObject.container : this.ghostObject;
    placedContainer.position.copy(ghostContainer.position);
    placedContainer.rotation.copy(ghostContainer.rotation);
    
    const mapObject = this.mapManager.addObject(this.assetName, placed);
    if(props.name) mapObject.name = props.name;
    
    // If this is a floor asset (asset names that start with "floor"), give it a default Navigation component
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
    
    // Track usage
    window.app?.uiManager?.assetPanel?.state?.addRecentlyUsed(this.assetName);

    this.historyManager.recordAction('place', { mapObject });
    
    this.startRotation = this.rotation;
    this.placementPlaneHeight = placedContainer.position.y;
    this.updatePlacementPlane();
    
    if (this.paintMode && this.isFromPickup) {
        // Keep using picked up properties
    } else if (this.paintMode) {
        this.heightOffset = 0;
    } else {
        window.app?.toolManager?.setTool('none');
    }
}

export function cancel() {
    if (this.originalState) {
        // Prefer to re-add the exact original object reference if available,
        // otherwise fall back to re-creating via the stored mapObject descriptor.
        try {
            if (this.originalState.originalObject) {
                this.mapManager.addObjectDirect({
                    ...this.originalState.mapObject,
                    object: this.originalState.originalObject
                });
                // restore transform safely if object exists
                const obj = this.originalState.originalObject;
                if (obj.position && obj.rotation) {
                    obj.position.copy(this.originalState.position);
                    obj.rotation.copy(this.originalState.rotation);
                } else if (obj.container) {
                    obj.container.position.copy(this.originalState.position);
                    obj.container.rotation.copy(this.originalState.rotation);
                }
            } else {
                // no original reference — add the stored descriptor back
                this.mapManager.addObjectDirect(this.originalState.mapObject);
                const restored = this.originalState.mapObject.object;
                if (restored?.position && restored?.rotation) {
                    restored.position.copy(this.originalState.position);
                    restored.rotation.copy(this.originalState.rotation);
                } else if (restored?.container) {
                    restored.container.position.copy(this.originalState.position);
                    restored.container.rotation.copy(this.originalState.rotation);
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

export function clearGhost() {
    if (this.ghostObject) {
        disposeGhost(this.ghostObject, this.sceneManager, { 
            isLight: this.isLightAsset, 
            isText: this.isTextAsset,
            isShape: this.isShapeAsset,
            isConnector: this.isConnectorAsset,
            isNpc: this.isNpcAsset
        });
    }
    this.ghostObject = null;
    this.isLightAsset = false;
    this.isTextAsset = false;
    this.isShapeAsset = false;
    this.state.reset();
    this.rotationIndicator.hide();
    this.tooltip.style.display = 'none';
}