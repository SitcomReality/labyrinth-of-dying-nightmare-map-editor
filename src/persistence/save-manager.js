import * as THREE from 'three';

export class SaveManager {
    constructor(mapManager, sceneManager, assetManager) {
        this.mapManager = mapManager;
        this.sceneManager = sceneManager;
        this.assetManager = assetManager;
    }

    getSavedMaps() {
        const maps = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('map_')) {
                const name = key.substring(4);
                try {
                    const raw = localStorage.getItem(key);
                    const data = JSON.parse(raw);
                    if (data && data.metadata && data.mapData) {
                        maps.push({
                            name: data.metadata.name,
                            objectCount: data.metadata.objectCount,
                            lastModified: data.metadata.lastModified,
                            thumbnail: data.metadata.thumbnail
                        });
                    } else if (data && data.objects) {
                        maps.push({
                            name,
                            objectCount: Array.isArray(data.objects) ? data.objects.length : 0,
                            lastModified: 0,
                            thumbnail: null,
                            legacy: true
                        });
                    } else {
                        maps.push({ name, objectCount: 0, lastModified: 0, thumbnail: null, malformed: true });
                    }
                } catch (e) {
                    console.warn(`Malformed map data for key: ${key}`, e);
                    maps.push({ name, objectCount: 0, lastModified: 0, thumbnail: null, malformed: true });
                }
            }
        }
        return maps.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    }

    saveMap(name, thumbnail) {
        const mapData = this.mapManager.serialize();
        
        const metadata = {
            name: name,
            objectCount: this.mapManager.objects.length,
            lastModified: Date.now(),
            thumbnail: thumbnail || this.generateThumbnail(200, 120),
        };
        
        const saveData = {
            metadata: metadata,
            mapData: mapData
        };

        localStorage.setItem(`map_${name}`, JSON.stringify(saveData));
        this.mapManager.mapName = name;
        this.mapManager.isDirty = false;
        
        window.dispatchEvent(new CustomEvent('mapsChanged'));
    }

    getMapData(name) {
        const data = localStorage.getItem(`map_${name}`);
        if (data) {
            try {
                return JSON.parse(data);
            } catch(e) {
                console.error(`Failed to parse map data for: ${name}`, e);
                return null;
            }
        }
        return null;
    }

    loadMap(name) {
        const data = localStorage.getItem(`map_${name}`);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                const mapData = parsed.mapData || parsed;
                this.mapManager.deserialize(mapData, this.assetManager);
                this.mapManager.mapName = name;
                
                window.dispatchEvent(new CustomEvent('mapLoaded', { detail: { name } }));
                return true;
            } catch(e) {
                console.error(`Failed to load map: ${name}`, e);
                return false;
            }
        }
        return false;
    }
    
    deleteMap(name) {
        localStorage.removeItem(`map_${name}`);
        window.dispatchEvent(new CustomEvent('mapsChanged'));
    }

    generateThumbnail(width = 200, height = 120) {
        const originalPos = this.sceneManager.camera.position.clone();
        const originalRot = this.sceneManager.camera.rotation.clone();
        const originalAspect = this.sceneManager.camera.aspect;
        const originalSize = this.sceneManager.renderer.getSize(new THREE.Vector2());

        this.sceneManager.renderer.setSize(width, height, false);
        this.sceneManager.camera.aspect = width / height;
        this.sceneManager.camera.updateProjectionMatrix();
        
        this.sceneManager.camera.position.set(15, 25, 15);
        this.sceneManager.camera.lookAt(0, 0, 0);
        this.sceneManager.render();
        
        const dataURL = this.sceneManager.renderer.domElement.toDataURL('image/png');
        
        this.sceneManager.renderer.setSize(originalSize.x, originalSize.y, false);
        this.sceneManager.camera.aspect = originalAspect;
        this.sceneManager.camera.updateProjectionMatrix();
        this.sceneManager.camera.position.copy(originalPos);
        this.sceneManager.camera.rotation.copy(originalRot);
        this.sceneManager.render();
        
        return dataURL;
    }
}

