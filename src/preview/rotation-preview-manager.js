import * as THREE from 'three';

export class RotationPreviewManager {
    constructor(sceneManager, mapManager, cameraController) {
        this.sceneManager = sceneManager;
        this.mapManager = mapManager;
        this.cameraController = cameraController;
        this.isActive = false;
        this.previewGroups = [];
        this.originalObjectsVisibility = new Map();
    }

    toggle(isActive) {
        if (this.isActive === isActive) return;
        this.isActive = isActive;
        if (this.isActive) {
            this.activate();
        } else {
            this.deactivate();
        }
        window.dispatchEvent(new CustomEvent('rotationPreviewChanged', { detail: { isActive: this.isActive } }));
    }

    getSceneObject(mapObject) {
        if (!mapObject || !mapObject.object) return null;
        if (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape' || mapObject.type === 'connector') {
            return mapObject.object.container;
        }
        return mapObject.object;
    }

    activate() {
        // Disable other tools
        window.app.toolManager.setTool('none');

        // Save camera state
        this.cameraController.saveState();

        // 1. Hide original objects and store their state
        this.mapManager.objects.forEach(mapObject => {
            const obj = this.getSceneObject(mapObject);
            if (obj) {
                this.originalObjectsVisibility.set(obj, obj.visible);
                obj.visible = false;
            }
        });

        // 2. Calculate bounding box of the entire scene to position copies
        const sceneBounds = new THREE.Box3();
        const sceneCenter = new THREE.Vector3();
        let hasObjects = false;
        
        // Stores child visibility state before temporary bounds calculation
        const visibilityRestoreMap = new Map();

        this.mapManager.objects.forEach(mapObject => {
            const obj = this.getSceneObject(mapObject);
            if (obj) {
                hasObjects = true;

                // Temporarily force visibility on all relevant sub-components for bounds calculation
                // This is crucial for special objects (lights, text, connectors) whose helper/mesh children 
                // might be hidden by controllers, leading to inaccurate bounds calculation.
                obj.traverse(child => {
                    // Only track and set visibility for renderable elements that might define bounds
                    if (child.isMesh || child.isSprite || child.isLight) {
                        visibilityRestoreMap.set(child, child.visible);
                        child.visible = true;
                    }
                });
                
                // Set top container visible temporarily to ensure internal bounds expansion runs
                const wasVisible = obj.visible;
                obj.visible = true;

                sceneBounds.expandByObject(obj);
                
                // Restore top container visibility (which should be false from step 1)
                obj.visible = wasVisible; 

                // Restore child visibility state
                obj.traverse(child => {
                    if (visibilityRestoreMap.has(child)) {
                        child.visible = visibilityRestoreMap.get(child);
                    }
                });
                visibilityRestoreMap.clear();
            }
        });

        if (!hasObjects) {
            this.deactivate();
            return;
        }

        sceneBounds.getCenter(sceneCenter);
        const sceneSize = sceneBounds.getSize(new THREE.Vector3());
        
        // Add safeguard for minimum size for reliable spacing (e.g. 20x20 grid unit minimum)
        const minDim = 20; 
        sceneSize.x = Math.max(sceneSize.x, minDim);
        sceneSize.z = Math.max(sceneSize.z, minDim);
        
        const maxDim = Math.max(sceneSize.x, sceneSize.z);
        const spacing = maxDim * 1.2;

        const offsets = [
            new THREE.Vector3(-spacing / 2, 0, -spacing / 2),
            new THREE.Vector3(spacing / 2, 0, -spacing / 2),
            new THREE.Vector3(-spacing / 2, 0, spacing / 2),
            new THREE.Vector3(spacing / 2, 0, spacing / 2),
        ];
        const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

        // 3. Create four rotated copies
        for (let i = 0; i < 4; i++) {
            const group = new THREE.Group();
            this.mapManager.objects.forEach(mapObject => {
                const originalObj = this.getSceneObject(mapObject);
                if (originalObj) {
                    // Deep clone and normalize so preview is always visible and opaque
                    const clone = originalObj.clone(true);
                    
                    // FIX: Ensure the top-level clone object itself is visible, 
                    // as it inherited `visible=false` from the hidden original object.
                    clone.visible = true;
                    
                    clone.traverse((node) => {
                        // Ensure it's treated as a visual asset, not a ghost/transparent copy
                        // Hide light helper visuals (radius wireframes) so preview stays uncluttered
                        if (node.userData && node.userData.isLightHelper) {
                            node.visible = false;
                        }
                        if (node.isMesh) {
                            if (Array.isArray(node.material)) {
                                node.material = node.material.map(m => {
                                    const c = m?.clone ? m.clone() : m;
                                    if (c) { 
                                        c.transparent = false; 
                                        c.opacity = 1; 
                                        if (c.emissiveIntensity !== undefined) c.emissiveIntensity = 0; // Remove highlight emissive if present
                                    }
                                    return c;
                                });
                            } else if (node.material) {
                                const c = node.material?.clone ? node.material.clone() : node.material;
                                if (c) { 
                                    c.transparent = false; 
                                    c.opacity = 1; 
                                    if (c.emissiveIntensity !== undefined) c.emissiveIntensity = 0; // Remove highlight emissive if present
                                }
                                node.material = c;
                            }
                            node.visible = true;
                        }
                        if (node.isSprite && node.material) {
                            node.material = node.material?.clone ? node.material.clone() : node.material;
                            node.material.depthTest = false;
                            node.material.opacity = 1;
                            node.visible = true;
                        }
                    });
                    
                    // Center normalization
                    clone.position.sub(sceneCenter);
                    group.add(clone);
                }
            });
            group.rotation.y = rotations[i];
            group.position.copy(offsets[i]);
            this.sceneManager.scene.add(group);
            this.previewGroups.push(group);
        }

        // 4. Adjust camera to see all copies
        const overallBounds = new THREE.Box3();
        this.previewGroups.forEach(group => overallBounds.expandByObject(group));
        const center = overallBounds.getCenter(new THREE.Vector3());
        const size = overallBounds.getSize(new THREE.Vector3());
        const maxDimOverall = Math.max(size.x, size.y, size.z);
        const fov = this.cameraController.camera.fov * (Math.PI / 180);
        const distance = Math.abs(maxDimOverall / Math.sin(fov / 2));

        this.cameraController.transitions.transitionTo(
            new THREE.Vector3(center.x, distance * 0.7, center.z + distance * 0.7),
            { x: -Math.PI / 4, y: 0 }
        );
    }

    deactivate() {
        // 1. Remove preview groups
        this.previewGroups.forEach(group => {
            this.sceneManager.scene.remove(group);
            group.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.previewGroups = [];

        // 2. Restore original objects visibility
        this.mapManager.objects.forEach(mapObject => {
            const obj = this.getSceneObject(mapObject);
            if (obj && this.originalObjectsVisibility.has(obj)) {
                obj.visible = this.originalObjectsVisibility.get(obj);
            }
        });
        this.originalObjectsVisibility.clear();

        // 3. Restore camera
        this.cameraController.restoreState();

        // Re-enable select tool
        window.app.toolManager.setTool('select');
    }
}