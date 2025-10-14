import * as THREE from 'three';
import { LightObject } from '../lights/light-object.js';
import { TextObject } from '../text/text-object.js';
import { ShapeObject } from '../shapes/shape-object.js';
import { ConnectorObject } from '../connectors/connector-object.js';
import { NPCObject } from '../npc/npc-object.js';
import { arrayToPos, arrayToRot } from './serialize-utils.js';

// Helper for legacy format handling kept small and robust
async function handleLegacyFormat(data, mapManager, assetManager) {
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

    for (const objData of data.objects || []) {
        const pos = objData.position || { x: 0, y: 0, z: 0 };
        const rot = objData.rotation || { x: 0, y: 0, z: 0 };

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
                containerForTransform = objectInstance?.container;
            } else {
                objectInstance = model;
                containerForTransform = model;
            }
        }
        if (containerForTransform) {
            containerForTransform.position.set(pos.x, pos.y, pos.z);
            containerForTransform.rotation.set(rot.x, rot.y, rot.z);
            containerForTransform.scale.set(scaleX, 1, scaleZ);
        }
        const mapObject = {
            id: objData.id, assetName: objData.assetName, object: objectInstance, name: objData.name || objData.assetName,
            type: objectType, position: containerForTransform.position.clone(), rotation: containerForTransform.rotation.clone(),
            obId: objData.obId || null, components: objData.components || null,
            scaleX, scaleZ
        };
        mapManager.addObjectDirect(mapObject);
    }
}

export async function deserializeMap(data, mapManager, assetManager) {
    // OLD FORMAT Deserialization
    if (!data.formatVersion) {
        await handleLegacyFormat(data, mapManager, assetManager);
        return;
    }

    // NEW FORMAT Deserialization (v2.0+)
    const { defs = {}, instances = {}, environment } = data;

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
}