import * as THREE from 'three';

export class NPCObject {
    constructor(config, name) {
        this.config = { ...config };
        this.name = name;
        this.container = new THREE.Group();
        this.mesh = null;
        this.sprite = null;
        this.isDisposed = false;
        this.createMesh();
        this.createSprite();
    }
    createMesh() {
        if (this.mesh) {
            this.container.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        const geom = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
        const mat = new THREE.MeshStandardMaterial({ color: this.config.color, metalness: 0.05, roughness: 0.8 });
        this.mesh = new THREE.Mesh(geom, mat);
        this.mesh.castShadow = true; this.mesh.receiveShadow = true;
        this.container.add(this.mesh);
    }
    createSprite() {
        const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + (this.config.spriteColor ?? 0x4a9eff).toString(16).padStart(6,'0');
        ctx.beginPath(); ctx.arc(32, 20, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillRect(30, 28, 4, 16); // body
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, depthWrite: false, sizeAttenuation: false });
        this.sprite = new THREE.Sprite(mat);
        this.sprite.scale.set(0.12, 0.12, 1);
        this.sprite.renderOrder = 1000;
        this.sprite.userData.isNpcSprite = true;
        this.container.add(this.sprite);
    }
    setEditorVisibility(visible) { if (this.sprite) this.sprite.visible = visible; }
    setType(t) { this.config.npcType = t; }
    setPropA(v) { this.config.propA = v; }
    setPropB(v) { this.config.propB = v; }
    setColor(color) { this.config.color = color; if (this.mesh?.material) this.mesh.material.color.setHex(color); }
    update() {}
    serialize() { return { name: this.name, type: 'npc', config: { ...this.config } }; }
    static deserialize(data) { return new NPCObject(data.config, data.name); }
    dispose() {
        if (this.sprite) { this.sprite.material?.map?.dispose?.(); this.sprite.material?.dispose?.(); this.sprite.parent?.remove(this.sprite); this.sprite=null; }
        if (this.mesh) { this.mesh.geometry?.dispose?.(); this.mesh.material?.dispose?.(); this.mesh.parent?.remove(this.mesh); this.mesh=null; }
        if (this.container?.parent) this.container.parent.remove(this.container);
    }
}

