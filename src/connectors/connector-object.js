import * as THREE from 'three';

const ARROW_SHAPE = new THREE.Shape();
ARROW_SHAPE.moveTo(0, 0.5);
ARROW_SHAPE.lineTo(0.5, 0);
ARROW_SHAPE.lineTo(0.25, 0);
ARROW_SHAPE.lineTo(0.25, -0.5);
ARROW_SHAPE.lineTo(-0.25, -0.5);
ARROW_SHAPE.lineTo(-0.25, 0);
ARROW_SHAPE.lineTo(-0.5, 0);
ARROW_SHAPE.lineTo(0, 0.5);

const EXTRUDE_SETTINGS = {
    steps: 1,
    depth: 0.1,
    bevelEnabled: false
};

export class ConnectorObject {
    constructor(config, name) {
        this.config = { ...config };
        this.name = name;
        this.container = new THREE.Group();
        this.mesh = null;
        this.isDisposed = false;

        this.createMesh();
        this.createSprite();
        this.setDirection(this.config.direction);
    }

    createMesh() {
        if (this.isDisposed) return;
        if (this.mesh) {
            this.container.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }

        const geometry = new THREE.ExtrudeGeometry(ARROW_SHAPE, EXTRUDE_SETTINGS);
        geometry.center();

        const material = new THREE.MeshStandardMaterial({
            color: this.config.color,
            metalness: 0.1,
            roughness: 0.8
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Rotate mesh to lie flat on XZ plane initially
        this.mesh.rotation.x = -Math.PI / 2;

        this.container.add(this.mesh);
    }

    createSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Draw a simple link/chain icon
        ctx.strokeStyle = '#' + this.config.spriteColor.toString(16).padStart(6, '0');
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(24, 24, 10, -Math.PI/2, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(40, 40, 10, Math.PI/2, Math.PI * 2.5);
        ctx.stroke();

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
        this.sprite.userData.isConnectorSprite = true;
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

    setDirection(direction) {
        this.config.direction = direction;
        switch (direction) {
            case 'north':
                this.container.rotation.y = 0;
                break;
            case 'east':
                this.container.rotation.y = -Math.PI / 2;
                break;
            case 'south':
                this.container.rotation.y = Math.PI;
                break;
            case 'west':
                this.container.rotation.y = Math.PI / 2;
                break;
        }
    }

    setConnectionType(type) {
        this.config.connectionType = type;
    }

    update(deltaTime) {}

    serialize() {
        return {
            name: this.name,
            type: 'connector',
            config: { ...this.config }
        };
    }

    static deserialize(data) {
        return new ConnectorObject(data.config, data.name);
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
                this.container.remove(this.container.children[0]);
            }
            if (this.container.parent) {
                this.container.parent.remove(this.container);
            }
        }
    }
}