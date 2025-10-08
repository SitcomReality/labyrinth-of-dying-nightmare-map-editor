import * as THREE from 'three';

export class MapActions {
    constructor(mapManager, sceneManager, historyManager) {
        this.mapManager = mapManager;
        this.sceneManager = sceneManager;
        this.historyManager = historyManager;
    }

    addObject(assetName, object) {
        const isLightObject = !!(object && object.container && object.light);
        // Be robust: classify by explicit config.type when available, not just presence of mesh/sprite (which may be async)
        const isTextObject = !!(object && object.container && (object.config?.type === 'text' || object.textMesh));
        const isShapeObject = !!(object && object.container && (object.config?.type === 'shape' || object.mesh) && !object.light);

        // Resolve the actual container/target that holds transform data, with fallbacks
        const container = (isLightObject || isTextObject || isShapeObject)
            ? object?.container
            : (object && (object.position !== undefined && object.rotation !== undefined) ? object : (object?.container || null));

        const safeVec = (v) => {
            try {
                return v && v.clone ? v.clone() : (v ? { ...v } : { x: 0, y: 0, z: 0 });
            } catch (e) {
                return { x: 0, y: 0, z: 0 };
            }
        };

        const mapObject = {
            id: this.mapManager.generateId(),
            assetName,
            object,
            name: assetName,
            type: isLightObject ? 'light' : isTextObject ? 'text' : isShapeObject ? 'shape' : 'model',
            position: container ? safeVec(container.position) : { x: 0, y: 0, z: 0 },
            rotation: container ? safeVec(container.rotation) : { x: 0, y: 0, z: 0 }
        };

        this.mapManager.objects.push(mapObject);
        if (mapObject.type === 'model') {
            // Model: object IS the three.js group/mesh
            this.sceneManager.addObject(object);
        }
        // Light, Text, and Shape objects are added to scene via their controllers,
        // which are called from placement-logic or map-manager (on deserialize).
        
        this.mapManager.isDirty = true;
        this.autoSave();
        window.dispatchEvent(new CustomEvent('mapObjectsChanged'));

        return mapObject;
    }

    removeObject(object) {
        const index = this.mapManager.objects.findIndex(o => o.object === object);
        if (index > -1) {
            const mapObject = this.mapManager.objects[index];
            this.mapManager.objects.splice(index, 1);

            if (mapObject.type === 'light') {
                window.app?.lightController?.removeLight(object);
            } else if (mapObject.type === 'text') {
                window.app?.textController?.removeText(object);
            } else if (mapObject.type === 'shape') {
                window.app?.shapeController?.removeShape(object);
            } else {
                this.sceneManager.removeObject(object);
            }

            this.mapManager.isDirty = true;
            this.autoSave();
            window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
        }
    }

    updateObjectProperties(mapObject, properties) {
        Object.assign(mapObject, properties);
        if (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape') {
            mapObject.position = mapObject.object.container.position.clone();
            mapObject.rotation = mapObject.object.container.rotation.clone();
        } else {
            mapObject.position = mapObject.object.position.clone();
            mapObject.rotation = mapObject.object.rotation.clone();
        }
        this.mapManager.isDirty = true;
        this.autoSave();
        window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
    }

    autoSave() {
        this.mapManager.autoSave();
    }

    clear() {
        this.mapManager.objects.forEach(obj => {
            if (obj.type === 'light') {
                window.app?.lightController?.removeLight(obj.object);
            } else if (obj.type === 'text') {
                this.sceneManager.removeObject(obj.object.container);
                obj.object.dispose && obj.object.dispose();
            } else if (obj.type === 'shape') {
                this.sceneManager.removeObject(obj.object.container);
                obj.object.dispose && obj.object.dispose();
            } else {
                this.sceneManager.removeObject(obj.object);
            }
        });
    }
}