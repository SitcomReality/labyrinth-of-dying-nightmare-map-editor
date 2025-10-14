// Utility helpers used by map serializer (rounding, array conversions, deepEqual, etc.)
export const PRECISION = 4;

export function round(val, places = PRECISION) {
    const factor = Math.pow(10, places);
    return Math.round(val * factor) / factor;
}

export function posToArray(pos) {
    if (!pos) return [0, 0, 0];
    return [round(pos.x), round(pos.y), round(pos.z)];
}

export function rotToArray(rot) {
    if (!rot) return [0, 0, 0];
    return [round(rot.x), round(rot.y), round(rot.z)];
}

export function arrayToPos(arr) {
    const safeArr = arr || [];
    return { x: safeArr[0] || 0, y: safeArr[1] || 0, z: safeArr[2] || 0 };
}

export function arrayToRot(arr) {
    const safeArr = arr || [];
    return { x: safeArr[0] || 0, y: safeArr[1] || 0, z: safeArr[2] || 0 };
}

export function isDefaultPosition(pos) {
    return pos.x === 0 && pos.y === 0 && pos.z === 0;
}

export function isDefaultRotation(rot) {
    return rot.x === 0 && rot.y === 0 && rot.z === 0;
}

export function deepEqual(obj1, obj2) {
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