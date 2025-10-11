import * as THREE from 'three';
import { LightObject } from '../lights/light-object.js';
import { TextObject } from '../text/text-object.js';
import { ShapeObject } from '../shapes/shape-object.js';
import { ConnectorObject } from '../connectors/connector-object.js';
import { NPCObject } from '../npc/npc-object.js';

const PRECISION = 4;

function round(val, places = PRECISION) {
    const factor = Math.pow(10, places);
    return Math.round(val * factor) / factor;
}

function posToArray(pos) {
    if (!pos) return [0, 0, 0];
    return [round(pos.x), round(pos.y), round(pos.z)];
}

function rotToArray(rot) {
    if (!rot) return [0, 0, 0];
    return [round(rot.x), round(rot.y), round(rot.z)];
}

function arrayToPos(arr) {
    const safeArr = arr || [];
    return { x: safeArr[0] || 0, y: safeArr[1] || 0, z: safeArr[2] || 0 };
}

function arrayToRot(arr) {
    const safeArr = arr || [];
    return { x: safeArr[0] || 0, y: safeArr[1] || 0, z: safeArr[2] || 0 };
}

function isDefaultPosition(pos) {
    return pos.x === 0 && pos.y === 0 && pos.z === 0;
}

function isDefaultRotation(rot) {
    return rot.x === 0 && rot.y === 0 && rot.z === 0;
}

// Deep equality check helper for JSON-like objects
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}


// serializeMap: create a JSON-serializable representation of the current map manager state
export function serializeMap(mapManager) {
    const defs = {};
    const instances = {};
    const groupedObjects = {};

    // Group objects by their assetName
    mapManager.objects.forEach(obj => {
        if (!groupedObjects[obj.assetName]) {
            groupedObjects[obj.assetName] = [];
        }
        groupedObjects[obj.assetName].push(obj);
    });

    // Process each group
    for (const assetName in groupedObjects) {
        const group = groupedObjects[assetName];
        if (group.length === 0) continue;

        const firstObj = group[0];
        const def = { type: firstObj.type };

        // Handle special object data
        if (firstObj.object?.serialize) {
            def.data = firstObj.object.serialize();
        }

        // Check if components are uniform across the group
        const firstComponents = firstObj.components || {};
        const areComponentsUniform = group.every(obj => deepEqual(obj.components || {}, firstComponents));
        if (areComponentsUniform && Object.keys(firstComponents).length > 0) {
            def.components = firstComponents;
        }

        defs[assetName] = def;
        instances[assetName] = group.map(obj => {
            const inst = { id: obj.id };
            if (!isDefaultPosition(obj.position)) inst.pos = posToArray(obj.position);
            if (!isDefaultRotation(obj.rotation)) inst.rot = rotToArray(obj.rotation);
            
            const flipX = obj.scaleX === -1;
            const flipZ = obj.scaleZ === -1;
            if (flipX) inst.flipX = true;
            if (flipZ) inst.flipZ = true;

            if (obj.name && obj.name !== obj.assetName) inst.name = obj.name;
            if (obj.obId) inst.obId = obj.obId;

            if (!areComponentsUniform && obj.components && Object.keys(obj.components).length > 0) {
                inst.components = obj.components;
            }
            
            // For special objects, check if instance data differs from def
            if (obj.object?.serialize) {
                const instanceData = obj.object.serialize();
                if (!deepEqual(instanceData, def.data)) {
                    inst.data = instanceData;
                }
            }

            return inst;
        });
    }

    return {
        name: mapManager.mapName,
        formatVersion: '2.0',
        metadata: { tags: { ...mapManager.metadata } },
        environment: mapManager.sceneManager.getEnvironmentState(),
        defs,
        instances,
    };
};

// deserializeMap: reconstruct objects into the mapManager using assetManager for clones
export async function deserializeMap(data, mapManager, assetManager) {
    // OLD FORMAT Deserialization
    if (!data.formatVersion) {
        // Apply environment (or defaults if missing) before restoring objects
        const sm = mapManager.sceneManager;
        const env = data.environment;
        if (env) {
            if (env.ambientLight !== undefined) sm.setAmbientLightIntensity(env.ambientLight);
            if (env.ambientColor !== undefined) sm.setAmbientLightColor(env.ambientColor);
            if (env.directionalLight !== undefined) sm.setDirectionalLightIntensity(env.directionalLight);
            if (env.directionalColor !== undefined) sm.setDirectionalLightColor(env.directionalColor);
            if (env.directionalRotationX !== undefined && env.directionalRotationY !== undefined) sm.setDirectionalLightRotation(env.directionalRotationX, env.directionalRotationY);
            if (env.backgroundColor !== undefined) sm.setSceneBackgroundColor(env.backgroundColor);
            if (env.fogColor !== undefined) sm.setFogColor(env.fogColor);
            if (env.fogDensity !== undefined) sm.setFogDensity(env.fogDensity);
        } else {
            sm.setAmbientLightIntensity(0.4); sm.setAmbientLightColor(0xffffff);
            sm.setDirectionalLightIntensity(0.8); sm.setDirectionalLightColor(0xffffff);
            sm.setDirectionalLightRotation(-1.0, 0.0);
            sm.setSceneBackgroundColor(0x1a1a1a); sm.setFogColor(0x1a1a1a); sm.setFogDensity(0);
        }

        mapManager.metadata = data.metadata?.tags ? { ...data.metadata.tags } : { typeTags: [], themeTags: [], gameplayTags: [] };

        for (const objData of data.objects) {
            const pos = objData.position || { x: 0, y: 0, z: 0 };
            const rot = objData.rotation || { x: 0, y: 0, z: 0 };
            
            // Assume default scale for legacy objects
            const scaleX = 1;
            const scaleZ = 1;

            let objectInstance = null;
            let objectType = objData.type || 'model';
            let containerForTransform = null;

            if (objectType === 'light') {
                objectInstance = LightObject.deserialize ? LightObject.deserialize(objData.lightData) : new LightObject(objData.lightData?.config || { type: 'point' }, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (objectType === 'text') {
                objectInstance = TextObject.deserialize ? TextObject.deserialize(objData.textData) : new TextObject(objData.textData?.config || {}, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (objectType === 'shape') {
                objectInstance = ShapeObject.deserialize ? ShapeObject.deserialize(objData.shapeData) : new ShapeObject(objData.shapeData?.config || {}, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (objectType === 'connector') {
                objectInstance = ConnectorObject.deserialize ? ConnectorObject.deserialize(objData.connectorData) : new ConnectorObject(objData.connectorData?.config || {}, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (objectType === 'npc') {
                objectInstance = NPCObject.deserialize ? NPCObject.deserialize(objData.npcData) : new NPCObject(objData.npcData?.config || {}, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else {
                const model = assetManager.cloneAsset(objData.assetName);
                if (!model) continue;

                if (model.type) {
                    if (model.type === 'light') objectInstance = new LightObject(model.config, objData.name || objData.assetName);
                    else if (model.type === 'text') objectInstance = new TextObject(model.config, objData.name || objData.assetName);
                    else if (model.type === 'shape') objectInstance = new ShapeObject(model.config, objData.name || objData.assetName);
                    else if (model.type === 'connector') objectInstance = new ConnectorObject(model.config, objData.name || objData.assetName);
                    else if (model.type === 'npc') objectInstance = new NPCObject(model.config, objData.name || objData.assetName);
                    containerForTransform = objectInstance.container;
                } else {
                    objectInstance = model;
                    containerForTransform = model;
                }
            }
            if (containerForTransform) {
                containerForTransform.position.set(pos.x, pos.y, pos.z);
                containerForTransform.rotation.set(rot.x, rot.y, rot.z);
                containerForTransform.scale.set(scaleX, 1, scaleZ); // Apply default scale explicitly
            }
            const mapObject = {
                id: objData.id, assetName: objData.assetName, object: objectInstance, name: objData.name || objData.assetName,
                type: objectType, position: containerForTransform.position.clone(), rotation: containerForTransform.rotation.clone(),
                obId: objData.obId || null, components: objData.components || null,
                scaleX, scaleZ // Add default scale properties
            };
            mapManager.addObjectDirect(mapObject);
        }
        return;
    }

    // NEW FORMAT Deserialization (v2.0+)
    const { defs, instances, environment } = data;

    // Apply environment
    const sm = mapManager.sceneManager;
    if (environment) {
        sm.setAmbientLightIntensity(environment.ambientLight ?? 0.4);
        sm.setAmbientLightColor(environment.ambientColor ?? 0xffffff);
        sm.setDirectionalLightIntensity(environment.directionalLight ?? 0.8);
        sm.setDirectionalLightColor(environment.directionalColor ?? 0xffffff);
        sm.setDirectionalLightRotation(environment.directionalRotationX ?? -1.0, environment.directionalRotationY ?? 0.0);
        sm.setSceneBackgroundColor(environment.backgroundColor ?? 0x1a1a1a);
        sm.setFogColor(environment.fogColor ?? 0x1a1a1a);
        sm.setFogDensity(environment.fogDensity ?? 0);
    }

    mapManager.metadata = data.metadata?.tags ? { ...data.metadata.tags } : {};

    // Recreate objects from definitions and instances
    for (const assetName in instances) {
        const def = defs[assetName];
        if (!def) continue;

        for (const inst of instances[assetName]) {
            let objectInstance;
            const objectType = def.type;
            const dataToUse = inst.data || def.data;

            if (objectType === 'light') objectInstance = LightObject.deserialize(dataToUse);
            else if (objectType === 'text') objectInstance = TextObject.deserialize(dataToUse);
            else if (objectType === 'shape') objectInstance = ShapeObject.deserialize(dataToUse);
            else if (objectType === 'connector') objectInstance = ConnectorObject.deserialize(dataToUse);
            else if (objectType === 'npc') objectInstance = NPCObject.deserialize(dataToUse);
            else objectInstance = assetManager.cloneAsset(assetName);

            if (!objectInstance) continue;

            const container = objectInstance.container || objectInstance;
            const pos = arrayToPos(inst.pos);
            const rot = arrayToRot(inst.rot);
            container.position.set(pos.x, pos.y, pos.z);
            container.rotation.set(rot.x, rot.y, rot.z);

            const components = inst.components || def.components || {};
            
            // Apply scale based on flip flags
            const scaleX = inst.flipX ? -1 : 1;
            const scaleZ = inst.flipZ ? -1 : 1;
            container.scale.set(scaleX, 1, scaleZ);

            const mapObject = {
                id: inst.id, assetName, object: objectInstance, name: inst.name || assetName, type: objectType,
                position: container.position.clone(), rotation: container.rotation.clone(),
                obId: inst.obId || null, components,
                scaleX, scaleZ
            };
            mapManager.addObjectDirect(mapObject);
        }
    }
};