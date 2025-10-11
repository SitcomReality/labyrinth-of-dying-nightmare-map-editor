import * as THREE from 'three';
/* ExtrudeGeometry caused 404 on some hosts; use a simple composed geometry (shaft + head) instead of extrude. */

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
        this.sprite = null;
        this.isDisposed = false;

        this.createMesh();
        this.createSprite();
        this.setDirection(this.config.direction);
    }

    createMesh() {
        if (this.isDisposed) return;
        
        // Clean up existing mesh
        if (this.mesh) {
            this.container.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                const materials = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
                materials.forEach(mat => mat.dispose());
            }
        }

        // Build a simple arrow composed of a thin shaft and a cone head so we don't rely on ExtrudeGeometry.
        const group = new THREE.Group();

        // Shaft
        const shaftGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 12);
        const shaftMat = new THREE.MeshStandardMaterial({ color: this.config.color, metalness: 0.1, roughness: 0.8 });
        const shaft = new THREE.Mesh(shaftGeom, shaftMat);
        shaft.position.set(0, 0, -0.25);
        shaft.rotation.x = Math.PI / 2;
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        group.add(shaft);

        // Head
        const headGeom = new THREE.ConeGeometry(0.18, 0.35, 16);
        const headMat = shaftMat; // reuse material reference for consistent disposal handling
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.set(0, 0, 0.25);
        head.rotation.x = Math.PI / 2;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);

        // Normalize origin to center and orient to lie flat on XZ plane
        group.rotation.x = -Math.PI / 2;
        group.userData.type = 'connector';

        this.mesh = group;
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
            case 'north': this.container.rotation.y = 0; break;
            case 'east': this.container.rotation.y = -Math.PI / 2; break;
            case 'south': this.container.rotation.y = Math.PI; break;
            case 'west': this.container.rotation.y = Math.PI / 2; break;
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
        if (this.isDisposed) return;
        this.isDisposed = true;

        // Remove from parent container
        if (this.container && this.container.parent) {
            this.container.parent.remove(this.container);
        }

        // Dispose sprite
        if (this.sprite) {
            if (this.sprite.material?.map) this.sprite.material.map.dispose();
            if (this.sprite.material) this.sprite.material.dispose();
            this.sprite = null;
        }

        // Dispose mesh and materials
        if (this.mesh) {
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                const materials = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
                materials.forEach(mat => mat.dispose());
            }
            this.mesh = null;
        }

        // Clear container
        if (this.container) {
            while (this.container.children.length) {
                const child = this.container.children[0];
                this.container.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => mat.dispose());
                }
            }
        }
    }
}