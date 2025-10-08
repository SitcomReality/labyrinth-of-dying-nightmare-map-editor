export class CameraBounds {
    constructor(cameraController) {
        this.cameraController = cameraController;
        this.enabled = true;
        this.minX = -50;
        this.maxX = 50;
        this.minZ = -50;
        this.maxZ = 50;
        this.minY = 2;
        this.maxY = 50;
    }

    apply() {
        if (!this.enabled) return;
        
        const pos = this.cameraController.camera.position;
        
        pos.x = Math.max(this.minX, Math.min(this.maxX, pos.x));
        pos.y = Math.max(this.minY, Math.min(this.maxY, pos.y));
        pos.z = Math.max(this.minZ, Math.min(this.maxZ, pos.z));
    }

    setBounds(minX, maxX, minZ, maxZ, minY, maxY) {
        this.minX = minX;
        this.maxX = maxX;
        this.minZ = minZ;
        this.maxZ = maxZ;
        this.minY = minY;
        this.maxY = maxY;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

