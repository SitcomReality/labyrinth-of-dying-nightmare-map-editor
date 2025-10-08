export const SHAPE_ASSETS = {
    'Cube': {
        type: 'shape',
        shape: 'box',
        color: 0xffffff,
        spriteColor: 0xcccccc
    },
    'Sphere': {
        type: 'shape',
        shape: 'sphere',
        color: 0xffffff,
        spriteColor: 0xcccccc
    },
    'Cylinder': {
        type: 'shape',
        shape: 'cylinder',
        color: 0xffffff,
        spriteColor: 0xcccccc
    },
    'Cone': {
        type: 'shape',
        shape: 'cone',
        color: 0xffffff,
        spriteColor: 0xcccccc
    },
    'Torus': {
        type: 'shape',
        shape: 'torus',
        color: 0xffffff,
        spriteColor: 0xcccccc
    },
    'Icosahedron': {
        type: 'shape',
        shape: 'icosahedron',
        color: 0xffffff,
        spriteColor: 0xcccccc
    }
};

export function isShapeAsset(name) {
    return SHAPE_ASSETS.hasOwnProperty(name);
}

export function getShapeConfig(name) {
    return SHAPE_ASSETS[name] ? { ...SHAPE_ASSETS[name] } : null;
}