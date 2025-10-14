import { posToArray, rotToArray, isDefaultPosition, isDefaultRotation, deepEqual } from './serialize-utils.js';

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
        defs,
        instances,
    };
};