import * as THREE from 'three';

// serializeMap: create a JSON-serializable representation of the current map manager state
export function serializeMap(mapManager) {
    return {
        name: mapManager.mapName,
        environment: mapManager.sceneManager.getEnvironmentState(),
        objects: mapManager.objects.map(obj => {
            if (obj.type === 'light') {
                return {
                    id: obj.id,
                    assetName: obj.assetName,
                    name: obj.name,
                    type: 'light',
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    rotation: {
                        x: obj.rotation.x,
                        y: obj.rotation.y,
                        z: obj.rotation.z
                    },
                    lightData: obj.object.serialize ? obj.object.serialize() : null
                };
            } else if (obj.type === 'text') {
                return {
                    id: obj.id,
                    assetName: obj.assetName,
                    name: obj.name,
                    type: 'text',
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    rotation: {
                        x: obj.rotation.x,
                        y: obj.rotation.y,
                        z: obj.rotation.z
                    },
                    textData: obj.object.serialize ? obj.object.serialize() : null
                };
            } else if (obj.type === 'shape') {
                return {
                    id: obj.id,
                    assetName: obj.assetName,
                    name: obj.name,
                    type: 'shape',
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    rotation: {
                        x: obj.rotation.x,
                        y: obj.rotation.y,
                        z: obj.rotation.z
                    },
                    shapeData: obj.object.serialize ? obj.object.serialize() : null
                };
            } else if (obj.type === 'connector') {
                return {
                    id: obj.id,
                    assetName: obj.assetName,
                    name: obj.name,
                    type: 'connector',
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    rotation: {
                        x: obj.rotation.x,
                        y: obj.rotation.y,
                        z: obj.rotation.z
                    },
                    connectorData: obj.object.serialize ? obj.object.serialize() : null
                };
            } else if (obj.type === 'npc') {
                return {
                    id: obj.id,
                    assetName: obj.assetName,
                    name: obj.name,
                    type: 'npc',
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    rotation: {
                        x: obj.rotation.x,
                        y: obj.rotation.y,
                        z: obj.rotation.z
                    },
                    npcData: obj.object.serialize ? obj.object.serialize() : null
                };
            } else {
                return {
                    id: obj.id,
                    assetName: obj.assetName,
                    name: obj.name,
                    type: 'model',
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    rotation: {
                        x: obj.rotation.x,
                        y: obj.rotation.y,
                        z: obj.rotation.z
                    }
                };
            }
        })
    };
};

// deserializeMap: reconstruct objects into the mapManager using assetManager for clones
export async function deserializeMap(data, mapManager, assetManager) {
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

    // Note: this mirrors previous MapManager.deserialize behavior, but lives here for clarity
    for (const objData of data.objects) {
        const pos = objData.position || { x: 0, y: 0, z: 0 };
        const rot = objData.rotation || { x: 0, y: 0, z: 0 };

        let objectInstance = null;
        let objectType = objData.type || 'model';
        let containerForTransform = null;

        if (objectType === 'light') {
            const { LightObject } = await import('../lights/light-object.js');
            objectInstance = LightObject.deserialize ? LightObject.deserialize(objData.lightData) : new LightObject(objData.lightData?.config || { type: 'point' }, objData.name || objData.assetName);
            containerForTransform = objectInstance.container;
        } else if (objectType === 'text') {
            const { TextObject } = await import('../text/text-object.js');
            objectInstance = TextObject.deserialize ? TextObject.deserialize(objData.textData) : new TextObject(objData.textData?.config || {}, objData.name || objData.assetName);
            containerForTransform = objectInstance.container;
        } else if (objectType === 'shape') {
            const { ShapeObject } = await import('../shapes/shape-object.js');
            objectInstance = ShapeObject.deserialize ? ShapeObject.deserialize(objData.shapeData) : new ShapeObject(objData.shapeData?.config || {}, objData.name || objData.assetName);
            containerForTransform = objectInstance.container;
        } else if (objectType === 'connector') {
            const { ConnectorObject } = await import('../connectors/connector-object.js');
            objectInstance = ConnectorObject.deserialize ? ConnectorObject.deserialize(objData.connectorData) : new ConnectorObject(objData.connectorData?.config || {}, objData.name || objData.assetName);
            containerForTransform = objectInstance.container;
        } else if (objectType === 'npc') {
            const { NPCObject } = await import('../npc/npc-object.js');
            objectInstance = NPCObject.deserialize ? NPCObject.deserialize(objData.npcData) : new NPCObject(objData.npcData?.config || {}, objData.name || objData.assetName);
            containerForTransform = objectInstance.container;
        } else {
            const model = assetManager.cloneAsset(objData.assetName);
            if (!model) {
                console.warn(`MapManager.deserialize: missing asset clone for "${objData.assetName}", skipping.`);
                continue;
            }

            // If cloneAsset returned a descriptor for special assets, instantiate proper objects
            if (model.type === 'text') {
                const { TextObject } = await import('../text/text-object.js');
                objectInstance = new TextObject(model.config, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (model.type === 'shape') {
                const { ShapeObject } = await import('../shapes/shape-object.js');
                objectInstance = new ShapeObject(model.config, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (model.type === 'light') {
                const { LightObject } = await import('../lights/light-object.js');
                objectInstance = new LightObject(model.config, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (model.type === 'connector') {
                const { ConnectorObject } = await import('../connectors/connector-object.js');
                objectInstance = new ConnectorObject(model.config, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else if (model.type === 'npc') {
                const { NPCObject } = await import('../npc/npc-object.js');
                objectInstance = new NPCObject(model.config, objData.name || objData.assetName);
                containerForTransform = objectInstance.container;
            } else {
                // Regular model clone (Three.Object3D)
                objectInstance = model;
                containerForTransform = model.position && model.rotation ? model : (model.model || null);
            }
        }

        if (containerForTransform) {
            containerForTransform.position.set(pos.x, pos.y, pos.z);
            containerForTransform.rotation.set(rot.x, rot.y, rot.z);
        }

        const mapObject = {
            id: objData.id,
            assetName: objData.assetName,
            object: objectInstance,
            name: objData.name || objData.assetName,
            type: objectType,
            position: containerForTransform.position.clone(),
            rotation: containerForTransform.rotation.clone()
        };

        mapManager.addObjectDirect(mapObject); // Use addObjectDirect to handle scene insertion/registration
    }
}