import * as THREE from 'three';

export class MinimapUI {
    constructor(sceneManager, cameraController, mapManager) {
        this.sceneManager = sceneManager;
        this.cameraController = cameraController;
        this.mapManager = mapManager;
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.size = 150;
        this.scale = 2;
        this.create();
        this.setupEventListeners();
    }

    create() {
        this.container = document.createElement('div');
        this.container.id = 'minimap';
        this.container.style.cssText = `
            position: absolute;
            bottom: 16px;
            right: 16px;
            width: ${this.size}px;
            height: ${this.size}px;
            background: rgba(10, 10, 10, 0.9);
            border: 2px solid #2a2a2a;
            border-radius: 8px;
            overflow: hidden;
        `;
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.cssText = 'display: block; width: 100%; height: 100%;';
        
        this.container.appendChild(this.canvas);
        document.getElementById('canvas-container').appendChild(this.container);
        
        this.ctx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
        window.addEventListener('mapObjectsChanged', () => this.render());
    }

    render() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Draw grid
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        const gridSize = 10;
        for (let i = 0; i <= this.size; i += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.size);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.size, i);
            this.ctx.stroke();
        }
        
        // Draw objects
        this.ctx.fillStyle = '#4a9eff';
        this.mapManager.objects.forEach(obj => {
            const x = this.worldToMinimap(obj.position.x);
            const z = this.worldToMinimap(obj.position.z);
            this.ctx.fillRect(x - 2, z - 2, 4, 4);
        });
        
        // Draw camera position
        const camX = this.worldToMinimap(this.cameraController.camera.position.x);
        const camZ = this.worldToMinimap(this.cameraController.camera.position.z);
        
        this.ctx.fillStyle = '#ff4a4a';
        this.ctx.beginPath();
        this.ctx.arc(camX, camZ, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw camera direction
        const direction = new THREE.Vector3();
        this.cameraController.camera.getWorldDirection(direction);
        const endX = camX + direction.x * 15;
        const endZ = camZ + direction.z * 15;
        
        this.ctx.strokeStyle = '#ff4a4a';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(camX, camZ);
        this.ctx.lineTo(endX, endZ);
        this.ctx.stroke();
    }

    worldToMinimap(coord) {
        return (coord / this.scale + 50) * (this.size / 100);
    }

    update() {
        this.render();
    }
}

