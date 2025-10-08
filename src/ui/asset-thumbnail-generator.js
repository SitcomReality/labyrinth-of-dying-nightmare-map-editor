import * as THREE from 'three';

export class AssetThumbnailGenerator {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.cache = new Map();
        this.dbName = 'AssetThumbnailsDB';
        this.storeName = 'thumbnails';
        this.db = null;
        this.initDB();
    }

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async getCachedThumbnail(assetName) {
        if (this.cache.has(assetName)) {
            return this.cache.get(assetName);
        }

        if (!this.db) await this.initDB();

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(assetName);

            request.onsuccess = () => {
                const thumbnail = request.result;
                if (thumbnail) {
                    this.cache.set(assetName, thumbnail);
                }
                resolve(thumbnail);
            };

            request.onerror = () => resolve(null);
        });
    }

    async cacheThumbnail(assetName, dataURL) {
        this.cache.set(assetName, dataURL);

        if (!this.db) await this.initDB();

        return new Promise((resolve) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(dataURL, assetName);

            request.onsuccess = () => resolve(true);
            request.onerror = () => resolve(false);
        });
    }

    async generateThumbnail(model, assetName, isLight = false) {
        // Check cache first
        const cached = await this.getCachedThumbnail(assetName);
        if (cached) return cached;
        
        // If no model provided, provide specialized icons for known lightweight asset types
        if (!model) {
            if (/connector|connection/i.test(assetName)) {
                const icon = this.generateConnectorIcon();
                await this.cacheThumbnail(assetName, icon);
                return icon;
            }
        }
        
        // If a "model" is not provided, and this asset is a text asset, generate a simple "Aa" icon
        if (!model && (/text/i.test(assetName) || /^(cube|sphere|cylinder|cone|torus|icosahedron)/i.test(assetName))) {
            let icon;
            if (/text/i.test(assetName)) {
                icon = this.generateTextIcon();
            } else {
                icon = this.generateShapeIcon();
            }
            await this.cacheThumbnail(assetName, icon);
            return icon;
        }

        // For lights, generate a special icon
        if (isLight) {
            return this.generateLightIcon(model.config);
        }

        // Create temporary scene and camera
        const tempScene = new THREE.Scene();
        tempScene.background = new THREE.Color(0x1a1a1a);

        const tempCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);

        // Clone model and add to temp scene
        const clone = model.clone();
        tempScene.add(clone);

        // Calculate bounding box and center
        const box = new THREE.Box3().setFromObject(clone);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Position camera
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        tempCamera.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
        tempCamera.lookAt(center);

        // Add lights
        const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(5, 5, 5);
        tempScene.add(light1);

        const light2 = new THREE.AmbientLight(0xffffff, 0.4);
        tempScene.add(light2);

        // Render to offscreen canvas
        const size64 = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size64;
        canvas.height = size64;

        const renderer = new THREE.WebGLRenderer({ 
            canvas, 
            antialias: true, 
            alpha: false,
            preserveDrawingBuffer: true 
        });
        renderer.setSize(size64, size64);
        renderer.render(tempScene, tempCamera);

        const dataURL = canvas.toDataURL('image/png');

        // Clean up
        renderer.dispose();
        tempScene.clear();

        // Cache the result
        await this.cacheThumbnail(assetName, dataURL);

        return dataURL;
    }

    generateLightIcon(config) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 64, 64);

        // Light glow
        const gradient = ctx.createRadialGradient(32, 32, 10, 32, 32, 28);
        gradient.addColorStop(0, '#' + config.spriteColor.toString(16).padStart(6, '0'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        // Light bulb
        ctx.fillStyle = '#' + config.spriteColor.toString(16).padStart(6, '0');
        ctx.beginPath();
        ctx.arc(32, 32, 16, 0, Math.PI * 2);
        ctx.fill();

        // Rays
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = 32 + Math.cos(angle) * 18;
            const y1 = 32 + Math.sin(angle) * 18;
            const x2 = 32 + Math.cos(angle) * 24;
            const y2 = 32 + Math.sin(angle) * 24;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        return canvas.toDataURL('image/png');
    }

    generateTextIcon() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 64, 64);
        // Large "Aa" text
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 36px Noto Sans, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Aa', 32, 34);
        // Subtle border
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 60, 60);
        return canvas.toDataURL('image/png');
    }

    generateShapeIcon() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 64, 64);
        // Simple cube icon
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 16, 32, 32);

        ctx.fillStyle = 'rgba(224, 224, 224, 0.2)';
        ctx.fillRect(16, 16, 32, 32);

        return canvas.toDataURL('image/png');
    }

    generateConnectorIcon() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 64, 64);
        // Draw ring
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 32, 18, 0, Math.PI * 2);
        ctx.stroke();
        // Draw small arrow/chevron in center
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.moveTo(32, 20);
        ctx.lineTo(40, 32);
        ctx.lineTo(32, 28);
        ctx.lineTo(24, 32);
        ctx.closePath();
        ctx.fill();
        return canvas.toDataURL('image/png');
    }
}