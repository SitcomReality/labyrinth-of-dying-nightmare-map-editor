import { BaseTool } from './base-tool.js';
import { RotationGizmo } from './widgets/rotation-gizmo.js';

export class RotateTool extends BaseTool {
    constructor(sceneManager, inputManager, mapManager, historyManager) {
        super(sceneManager, inputManager);
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        this.selectedObject = null;
        this.gizmo = new RotationGizmo(sceneManager);
        this.initialRotation = null;
        // Override highlight color for rotate tool
        this.highlightColor = 0xff9500; // Orange
        this.updateHighlightMaterial();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('gizmoRotationChanged', (e) => {
            if (this.selectedObject) {
                // Must robustly find mapObject regardless of whether selectedObject is a Model or a special object container
                const mapObject = this.mapManager.objects.find(o => {
                    const objectToMatch = (o.type === 'light' || o.type === 'text' || o.type === 'shape') 
                        ? o.object.container 
                        : o.object;
                    return objectToMatch === this.selectedObject;
                });
                
                if (mapObject) {
                    mapObject.rotation[e.detail.axis] = e.detail.rotation;
                    window.dispatchEvent(new CustomEvent('objectRotated', { detail: mapObject }));
                }
            }
        });
    }

    activate() {
        super.activate();
        this.gizmo.setSnapToAngle(this.snapToGrid);
    }

    setSnapToGrid(enabled) {
        super.setSnapToGrid(enabled);
        this.gizmo.setSnapToAngle(enabled);
    }

    handleMouseMove(event) {
        this.gizmo.handleMouseMove(event, this.sceneManager.camera, this.sceneManager.container);
        
        if (!this.gizmo.isDragging) {
            this.updateMousePosition(event);
            const intersects = this.raycast();
            
            if (intersects.length > 0) {
                let object = intersects[0].object;
                
                // Resolve to top-level object container before highlighting
                // The BaseTool.highlightObject handles the full traversal, but we need to ensure the object is resolved
                // up to the scene child first to avoid highlighting internal gizmo parts accidentally.
                
                if (object.userData && (object.userData.isLightSprite || object.userData.isTextSprite || object.userData.isLightHelper || object.userData.isShapeSprite)) {
                    object = object.parent;
                }

                while (object.parent && object.parent !== this.sceneManager.scene) {
                    object = object.parent;
                }
                
                // Don't highlight gizmo parts
                if (!intersects[0].object.userData.isGizmo) {
                    this.highlightObject(object);
                }
            } else {
                this.clearHighlight();
            }
        }
    }

    handleMouseDown(event) {
        // Try gizmo interaction first
        const gizmoHandled = this.gizmo.handleMouseDown(
            event, 
            this.sceneManager.camera, 
            this.sceneManager.container
        );
        
        if (gizmoHandled) {
            // Store initial rotation for undo
            if (this.selectedObject) {
                const mapObject = this.mapManager.objects.find(o => {
                    const objectToMatch = (o.type === 'light' || o.type === 'text' || o.type === 'shape') 
                        ? o.object.container 
                        : o.object;
                    return objectToMatch === this.selectedObject;
                });
                if (mapObject) {
                    this.initialRotation = {
                        x: mapObject.rotation.x,
                        y: mapObject.rotation.y,
                        z: mapObject.rotation.z
                    };
                }
            }
            return;
        }
        
        // If gizmo didn't handle it, select a new object
        if (event.button !== 0) return;
        
        this.updateMousePosition(event);
        const intersects = this.raycast();
        
        if (intersects.length > 0 && !intersects[0].object.userData.isGizmo) {
            let object = intersects[0].object;
            
            // Resolve object to top-level scene object/container:
            // 1. Resolve sprites/helpers to their parent container
            if (object.userData && (object.userData.isLightSprite || object.userData.isTextSprite || object.userData.isLightHelper || object.userData.isShapeSprite)) {
                object = object.parent;
            }
            
            // 2. Traverse up to the object attached directly to the scene
            while (object.parent && object.parent !== this.sceneManager.scene) {
                object = object.parent;
            }

            this.selectObject(object);
        } else {
            this.deselectObject();
        }
    }

    handleMouseUp(event) {
        const gizmoHandled = this.gizmo.handleMouseUp(event);
        
        if (gizmoHandled && this.initialRotation) {
            // Record rotation change in history
            const mapObject = this.mapManager.objects.find(o => {
                const objectToMatch = (o.type === 'light' || o.type === 'text' || o.type === 'shape') 
                    ? o.object.container 
                    : o.object;
                return objectToMatch === this.selectedObject;
            });

            if (mapObject) {
                this.historyManager.recordAction('rotate', {
                    mapObject: mapObject,
                    oldRotation: this.initialRotation,
                    newRotation: {
                        x: mapObject.rotation.x,
                        y: mapObject.rotation.y,
                        z: mapObject.rotation.z
                    }
                });
                this.mapManager.isDirty = true;
            }
            this.initialRotation = null;
        }
    }

    selectObject(object) {
        this.deselectObject();
        
        // object is already the top-level container/model, resolved in handleMouseDown
        
        this.selectedObject = object;
        this.gizmo.attachTo(object);
        
        const mapObject = this.mapManager.objects.find(o => {
            if (o.type === 'light' || o.type === 'text' || o.type === 'shape') {
                return o.object.container === object;
            }
            return o.object === object;
        });
        
        if (mapObject) {
            // Show light helper if it's a light (needed for selection consistency)
            if (mapObject.type === 'light') {
                window.app?.lightController?.showHelpers(mapObject.object);
            }
            window.dispatchEvent(new CustomEvent('objectSelected', { detail: mapObject }));
        }
    }

    deselectObject() {
        if (this.selectedObject) {
            this.gizmo.hide();
            this.selectedObject = null;
            window.dispatchEvent(new CustomEvent('objectDeselected'));
        }
    }

    update() {
        this.gizmo.update();
    }

    deactivate() {
        this.clearHighlight();
        this.deselectObject();
    }
}