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

        // Calculate bounding box of the entire scene to position copies
        const sceneBounds = new THREE.Box3();
        const sceneCenter = new THREE.Vector3();
        let hasObjects = false;
        this.mapManager.objects.forEach(mapObject => {
            const obj = this.getSceneObject(mapObject);
            if (obj) {
                // Temporarily make it visible to compute bounding box
                const wasVisible = obj.visible;
                obj.visible = true;
                sceneBounds.expandByObject(obj);
                obj.visible = wasVisible; // Restore original temp visibility state
                hasObjects = true;
            }
        });

        if (!hasObjects) {
            this.deactivate();
            return;
        }

        sceneBounds.getCenter(sceneCenter);
        const sceneSize = sceneBounds.getSize(new THREE.Vector3());
        const maxDim = Math.max(sceneSize.x, sceneSize.z);
        const spacing = maxDim * 1.2;

        const offsets = [
            new THREE.Vector3(-spacing / 2, 0, -spacing / 2),
            new THREE.Vector3(spacing / 2, 0, -spacing / 2),
            new THREE.Vector3(-spacing / 2, 0, spacing / 2),
            new THREE.Vector3(spacing / 2, 0, spacing / 2),
        ];
        const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];

        // 2. Create four rotated copies
        for (let i = 0; i < 4; i++) {
            const group = new THREE.Group();
            this.mapManager.objects.forEach(mapObject => {
                const originalObj = this.getSceneObject(mapObject);
                if (originalObj) {
                    const clone = originalObj.clone();
                    clone.position.sub(sceneCenter);
                    group.add(clone);
                }
            });
            group.rotation.y = rotations[i];
            group.position.copy(offsets[i]);
            this.sceneManager.scene.add(group);
            this.previewGroups.push(group);
        }

        // 3. Adjust camera to see all copies
        const overallBounds = new THREE.Box3();
        this.previewGroups.forEach(group => overallBounds.expandByObject(group));
        const center = overallBounds.getCenter(new THREE.Vector3());
        const size = overallBounds.getSize(new THREE.Vector3());
        const maxDimOverall = Math.max(size.x, size.y, size.z);
        const fov = this.cameraController.camera.fov * (Math.PI / 180);
        const distance = Math.max(8, maxDimOverall / Math.tan(fov / 2)); // ensure a sane minimum
        const camPos = new THREE.Vector3(center.x, center.y + distance * 0.6, center.z + distance * 0.9);
        const dx = center.x - camPos.x, dz = center.z - camPos.z, dy = center.y - camPos.y;
        const yaw = Math.atan2(dx, dz);
        const horiz = Math.sqrt(dx*dx + dz*dz);
        const pitch = Math.atan2(dy, horiz);
        this.cameraController.transitions.transitionTo(camPos, { x: pitch, y: yaw });
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