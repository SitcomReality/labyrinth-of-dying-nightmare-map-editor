import { serializeMap, deserializeMap } from './map-serializer.js';
import { SaveStore } from './map-storage.js';
import { MapActions } from './map-actions.js';

export class MapManager {
    constructor(sceneManager, historyManager) {
        this.sceneManager = sceneManager;
        this.historyManager = historyManager;
        this.objects = [];
        this.mapName = 'Untitled Map';
        this.isDirty = false;
        // metadata tags for map classification
        this.metadata = { typeTags: [], themeTags: [], gameplayTags: [] };

        this._saveStore = new SaveStore(this);
        this._actions = new MapActions(this, sceneManager, historyManager);
    }

    addObjectDirect(mapObject) {
        this.objects.push(mapObject);
        if (mapObject.type === 'light') {
            window.app?.lightController?.addLight(mapObject.object); 
        } else if (mapObject.type === 'text') {
            window.app?.textController?.addText(mapObject.object);
        } else if (mapObject.type === 'shape') {
            window.app?.shapeController?.addShape(mapObject.object);
        } else if (mapObject.type === 'connector') {
            window.app?.connectorController?.addConnector(mapObject.object);
        } else if (mapObject.type === 'npc') {
            window.app?.npcController?.addNPC(mapObject.object);
        } else {
            this.sceneManager.addObject(mapObject.object);
        }
        this.isDirty = true;
        window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
    }

    addObject(assetName, object) {
        return this._actions.addObject(assetName, object);
    }

    removeObject(object) {
        return this._actions.removeObject(object);
    }

    updateObjectProperties(mapObject, properties) {
        return this._actions.updateObjectProperties(mapObject, properties);
    }

    getObjectById(id) {
        return this.objects.find(o => o.id === id);
    }

    clear() {
        this._actions.clear();
        this.objects = [];
        this.isDirty = false;
        // keep metadata, but reset tags on clear
        this.metadata = { typeTags: [], themeTags: [], gameplayTags: [] };
        window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
    }

    generateId() {
        return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    save(name) {
        this.mapName = name || this.mapName;
        const data = serializeMap(this);
        this._saveStore.saveMap(this.mapName, data);
        this.isDirty = false;
    }

    autoSave() {
        if (!this.mapName || this.mapName === 'Untitled Map') {
            const untitledMaps = this._saveStore.getUntitledMapCount();
            this.mapName = `Untitled Map (${untitledMaps + 1})`;
        }
        this.save();
    }

    getUntitledMapCount() {
        return this._saveStore.getUntitledMapCount();
    }

    getSavedMaps() {
        return this._saveStore.getSavedMaps();
    }

    getMapData(name) {
        return this._saveStore.getMapData(name);
    }

    loadMap(name, assetManager) {
        const parsed = this._saveStore.getMapData(name);
        if (!parsed) return false;
        try {
            const mapData = parsed.mapData || parsed;
            return this.deserialize(mapData, assetManager);
        } catch (e) {
            console.error(`Failed to load map: ${name}`, e);
            return false;
        }
    }

    deleteMap(name) {
        this._saveStore.deleteMap(name);
    }

    serialize() {
        return serializeMap(this);
    }

    async deserialize(data, assetManager) {
        this.clear();
        this.mapName = data.name;

        await deserializeMap(data, this, assetManager);

        this.isDirty = false;
        window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
    }

    exportXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<map name="${this.mapName}">\n`;

        this.objects.forEach(obj => {
            xml += `  <object id="${obj.id}" asset="${obj.assetName}" type="${obj.type}">\n`;
            xml += `    <position x="${obj.position.x}" y="${obj.position.y}" z="${obj.position.z}" />\n`;
            xml += `    <rotation x="${obj.rotation.x}" y="${obj.rotation.y}" z="${obj.rotation.z}" />\n`;
            xml += `  </object>\n`;
        });

        xml += '</map>';
        return xml;
    }
}