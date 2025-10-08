import * as THREE from 'three';

export class ShapeObject {
    constructor(config, name) {
        this.config = { ...config };
        this.name = name;
        this.container = new THREE.Group();
        this.mesh = null;
        this.isDisposed = false;

        // defaults per shape
        const s = this.config.shape;
        if (s === 'box') { this.config.width ??= 1; this.config.height ??= 1; this.config.depth ??= 1; }
        if (s === 'sphere') { this.config.radius ??= 0.5; }
        if (s === 'cylinder') { this.config.radiusTop ??= 0.5; this.config.radiusBottom ??= 0.5; this.config.height ??= 1; }
        if (s === 'cone') { this.config.radius ??= 0.5; this.config.height ??= 1; }
        if (s === 'torus') { this.config.radius ??= 0.5; this.config.tube ??= 0.2; }
        if (s === 'icosahedron') { this.config.radius ??= 0.5; }

        this.createMesh();
        this.createSprite();
    }

    createMesh() {
        if (this.isDisposed) return;

        if (this.mesh) {
            this.container.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        let geometry;
        switch (this.config.shape) {
            case 'box':
                geometry = new THREE.BoxGeometry(this.config.width ?? 1, this.config.height ?? 1, this.config.depth ?? 1);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(this.config.radius ?? 0.5, 32, 16);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(this.config.radiusTop ?? 0.5, this.config.radiusBottom ?? 0.5, this.config.height ?? 1, 32);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(this.config.radius ?? 0.5, this.config.height ?? 1, 32);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(this.config.radius ?? 0.5, this.config.tube ?? 0.2, 16, 100);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(this.config.radius ?? 0.5);
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        const material = new THREE.MeshStandardMaterial({
            color: this.config.color,
            metalness: 0.1,
            roughness: 0.5
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.container.add(this.mesh);
    }

    createSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = '#' + this.config.spriteColor.toString(16).padStart(6, '0');
        ctx.lineWidth = 4;
        ctx.strokeRect(16, 16, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            depthTest: false,
            depthWrite: false,
            sizeAttenuation: false
        });

        this.sprite = new THREE.Sprite(spriteMaterial);
        this.sprite.scale.set(0.1, 0.1, 1);
        this.sprite.renderOrder = 1000;
        this.sprite.userData.isShapeSprite = true;
        this.container.add(this.sprite);
    }

    setEditorVisibility(visible) {
        if (this.sprite) this.sprite.visible = visible;
    }

    setColor(color) {
        this.config.color = color;
        if (this.mesh && this.mesh.material) {
            this.mesh.material.color.setHex(color);
        }
    }

    setConfig(partial) {
        Object.assign(this.config, partial);
        this.createMesh();
    }

    update(deltaTime) {
        // No animation for now
    }

    serialize() {
        return {
            name: this.name,
            type: 'shape',
            config: { ...this.config }
        };
    }

    static deserialize(data) {
        return new ShapeObject(data.config, data.name);
    }

    dispose() {
        this.isDisposed = true;
        if (this.sprite) {
            if (this.sprite.material?.map) this.sprite.material.map.dispose();
            if (this.sprite.material) this.sprite.material.dispose();
            if (this.sprite.parent) this.sprite.parent.remove(this.sprite);
            this.sprite = null;
        }

        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            this.mesh = null;
        }

        if (this.container) {
            while (this.container.children.length) {
                const c = this.container.children[0];
                this.container.remove(c);
            }
            if (this.container.parent) {
                this.container.parent.remove(this.container);
            }
        }
    }
}