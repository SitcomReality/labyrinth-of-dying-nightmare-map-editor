// Simple wrapper around localStorage access for maps
export class SaveStore {
    constructor(mapManager) {
        this.mapManager = mapManager;
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
                        // New format
                        maps.push({
                            name: data.metadata.name,
                            objectCount: data.metadata.objectCount,
                            lastModified: data.metadata.lastModified,
                            thumbnail: data.metadata.thumbnail
                        });
                    } else if (data && data.objects) {
                        // Legacy format
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
                    maps.push({ name, objectCount: 0, lastModified: 0, thumbnail: null, malformed: true });
                }
            }
        }
        return maps.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    }

    saveMap(name, mapData) {
        // Preserve an existing thumbnail if present (so autosave doesn't wipe a previously-generated thumbnail)
        let preservedThumbnail = null;
        try {
            const prev = localStorage.getItem(`map_${name}`);
            if (prev) {
                const parsedPrev = JSON.parse(prev);
                if (parsedPrev && parsedPrev.metadata && parsedPrev.metadata.thumbnail) {
                    preservedThumbnail = parsedPrev.metadata.thumbnail;
                }
            }
        } catch (e) {
            // ignore parse errors and continue
        }

        const metadata = {
            name: name,
            objectCount: this.mapManager.objects.length,
            lastModified: Date.now(),
            thumbnail: preservedThumbnail || null
        };

        const saveData = {
            metadata,
            mapData
        };

        localStorage.setItem(`map_${name}`, JSON.stringify(saveData));
        this.mapManager.mapName = name;
        this.mapManager.isDirty = false;
        window.dispatchEvent(new CustomEvent('mapsChanged'));
    }

    getMapData(name, forExport = false) {
        const data = localStorage.getItem(`map_${name}`);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (forExport && parsed.metadata) {
                    delete parsed.metadata.thumbnail;
                }
                return parsed;
            } catch (e) {
                console.error(`Failed to parse map data for: ${name}`, e);
                return null;
            }
        }
        return null;
    }

    deleteMap(name) {
        localStorage.removeItem(`map_${name}`);
        window.dispatchEvent(new CustomEvent('mapsChanged'));
    }

    getUntitledMapCount() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('map_Untitled Map')) {
                count++;
            }
        }
        return count;
    }
}