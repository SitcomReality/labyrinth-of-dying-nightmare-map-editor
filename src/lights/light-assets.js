export const LIGHT_ASSETS = {
    'Point Light': {
        type: 'point',
        color: 0xffffff,
        intensity: 1,
        distance: 10,
        decay: 2,
        castShadow: true,
        spriteColor: 0xffff00
    },
    'Directional Light': {
        type: 'directional',
        color: 0xffffff,
        intensity: 0.5,
        castShadow: true,
        spriteColor: 0xffaa00
    }
};

export function isLightAsset(name) {
    return LIGHT_ASSETS.hasOwnProperty(name);
}

export function getLightConfig(name) {
    return LIGHT_ASSETS[name] ? { ...LIGHT_ASSETS[name] } : null;
}