import * as THREE from 'three';
import { LightObject } from '../lights/light-object.js';
import { TextObject } from '../text/text-object.js';
import { ShapeObject } from '../shapes/shape-object.js';
import { ConnectorObject } from '../connectors/connector-object.js';
import { NPCObject } from '../npc/npc-object.js';
import { serializeMap as _serializeMap } from './serialize-map-v2.js';
import { deserializeMap as _deserializeMap } from './deserialize-map-v2.js';

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
export const serializeMap = _serializeMap;

// deserializeMap: reconstruct objects into the mapManager using assetManager for clones
export const deserializeMap = _deserializeMap;