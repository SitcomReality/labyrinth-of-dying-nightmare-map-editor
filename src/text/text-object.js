import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export class TextObject {
    constructor(config, name) {
        this.config = { ...config };
        this.name = name;
        this.container = new THREE.Group();
        this.textMesh = null;
        this.font = null;
        this.isLoading = true;
        this.isDisposed = false;

        // Create editor sprite representation
        this.createSprite();

        // Load font and create text
        this.loadFont();
    }

    async loadFont() {
        const loader = new FontLoader();
        try {
            this.font = await loader.loadAsync('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json');
            if (!this.isDisposed) this.createTextMesh();
            this.isLoading = false;
        } catch (error) {
            console.error('Failed to load font:', error);
            this.isLoading = false;
        }
    }

    createTextMesh() {
        if (this.isDisposed) return;

        if (this.textMesh) {
            this.container.remove(this.textMesh);
            this.textMesh.geometry.dispose();
            this.textMesh.material.dispose();
        }

        if (!this.font) return;

        const geometry = new TextGeometry(this.config.text, {
            font: this.font,
            size: this.config.fontSize,
            height: this.config.extrusionDepth,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.01,
            bevelSegments: 3
        });

        geometry.computeBoundingBox();
        const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
        geometry.translate(centerOffset, 0, 0);

        const material = new THREE.MeshStandardMaterial({ 
            color: this.config.color,
            metalness: 0.1,
            roughness: 0.5
        });

        this.textMesh = new THREE.Mesh(geometry, material);
        this.textMesh.castShadow = true;
        this.textMesh.receiveShadow = true;
        this.container.add(this.textMesh);
    }

    createSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Draw text icon
        ctx.fillStyle = '#' + this.config.spriteColor.toString(16).padStart(6, '0');
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('T', 32, 32);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeText('T', 32, 32);

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
        this.sprite.userData.isTextSprite = true;
        this.container.add(this.sprite);
    }

    setEditorVisibility(visible) {
        if (this.sprite) this.sprite.visible = visible;
    }

    setText(text) {
        this.config.text = text;
        this.createTextMesh();
    }

    setFontSize(size) {
        this.config.fontSize = size;
        this.createTextMesh();
    }

    setExtrusionDepth(depth) {
        this.config.extrusionDepth = depth;
        this.createTextMesh();
    }

    setColor(color) {
        this.config.color = color;
        if (this.textMesh && this.textMesh.material) {
            this.textMesh.material.color.setHex(color);
        }
    }

    update(deltaTime) {
        // No animation for now
    }

    serialize() {
        return {
            name: this.name,
            type: 'text',
            config: { ...this.config }
        };
    }

    static deserialize(data) {
        return new TextObject(data.config, data.name);
    }

    dispose() {
        this.isDisposed = true;
        // Remove and dispose sprite
        if (this.sprite) {
            if (this.sprite.material?.map) this.sprite.material.map.dispose();
            if (this.sprite.material) this.sprite.material.dispose();
            if (this.sprite.parent) this.sprite.parent.remove(this.sprite);
            this.sprite = null;
        }

        // Remove and dispose text mesh
        if (this.textMesh) {
            if (this.textMesh.geometry) this.textMesh.geometry.dispose();
            if (this.textMesh.material) this.textMesh.material.dispose();
            if (this.textMesh.parent) this.textMesh.parent.remove(this.textMesh);
            this.textMesh = null;
        }

        // Remove any remaining children from container to avoid phantom objects
        if (this.container) {
            while (this.container.children.length) {
                const c = this.container.children[0];
                this.container.remove(c);
            }
            // If container is attached to a scene, remove it
            if (this.container.parent) {
                this.container.parent.remove(this.container);
            }
        }
    }
}