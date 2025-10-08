export const TEXT_ASSETS = {
    '3D Text': {
        type: 'text',
        text: 'Sample Text',
        fontSize: 1,
        extrusionDepth: 0.2,
        color: 0xffffff,
        spriteColor: 0x00ff95
    }
};

export function isTextAsset(name) {
    return TEXT_ASSETS.hasOwnProperty(name);
}

export function getTextConfig(name) {
    return TEXT_ASSETS[name] ? { ...TEXT_ASSETS[name] } : null;
}