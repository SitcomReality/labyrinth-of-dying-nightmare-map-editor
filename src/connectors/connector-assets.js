export const CONNECTOR_ASSETS = {
    'Connection Point': {
        type: 'connector',
        direction: 'north', // north, south, east, west
        connectionType: 'corridor', // corridor, doorway, etc.
        color: 0x4a9eff,
        spriteColor: 0x4a9eff
    }
};

export function isConnectorAsset(name) {
    return CONNECTOR_ASSETS.hasOwnProperty(name);
}

export function getConnectorConfig(name) {
    return CONNECTOR_ASSETS[name] ? { ...CONNECTOR_ASSETS[name] } : null;
}