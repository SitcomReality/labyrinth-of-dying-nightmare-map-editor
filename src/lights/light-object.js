import * as THREE from 'three';

export class LightObject {
    constructor(config, name) {
        this.config = { ...config };
        this.name = name;
        this.container = new THREE.Group();

        // Create actual light
        if (config.type === 'point') {
            this.light = new THREE.PointLight(
                config.color,
                config.intensity,
                config.distance,
                config.decay
            );
        } else if (config.type === 'directional') {
            this.light = new THREE.DirectionalLight(
                config.color,
                config.intensity
            );
            this.light.position.set(0, 10, 0);
            this.light.target.position.set(0, 0, 0);
            this.container.add(this.light.target);
        }

        if (config.castShadow) {
            this.light.castShadow = true;
            this.light.shadow.mapSize.width = 1024;
            this.light.shadow.mapSize.height = 1024;
        }

        this.container.add(this.light);

        // Create editor sprite representation
        this.createSprite();

        // Create visual helper for range
        this.createHelper();

        // Animation state (legacy flicker kept for compatibility)
        this.flickering = false;
        this.flickerSpeed = 0.1;
        this.flickerIntensity = 0.3;
        this.baseIntensity = config.intensity;
        this.flickerTime = 0;

        // New unified effect system
        this.effectType = 'none'; // 'none' | 'flicker' | 'pulse' | 'strobe' | 'noise'
        this.effectSpeed = 0.1;
        this.effectIntensity = 0.3;
        this._effectTime = 0;
    }

    createSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Draw lightbulb icon
        ctx.fillStyle = '#' + this.config.spriteColor.toString(16).padStart(6, '0');
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.stroke();

        // Draw rays
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x1 = 32 + Math.cos(angle) * 28;
            const y1 = 32 + Math.sin(angle) * 28;
            const x2 = 32 + Math.cos(angle) * 34;
            const y2 = 32 + Math.sin(angle) * 34;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

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
        this.sprite.userData.isLightSprite = true;
        this.container.add(this.sprite);
    }

    createHelper() {
        if (this.config.type === 'point') {
            const geometry = new THREE.SphereGeometry(this.config.distance, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: this.config.spriteColor,
                transparent: true,
                opacity: 0.1,
                wireframe: true,
                depthTest: false
            });
            this.helper = new THREE.Mesh(geometry, material);
            this.helper.renderOrder = 999;
            this.helper.userData.isLightHelper = true;
            this.container.add(this.helper);
        } else if (this.config.type === 'directional') {
            this.helper = new THREE.ArrowHelper(
                new THREE.Vector3(0, -1, 0),
                new THREE.Vector3(0, 0, 0),
                5,
                this.config.spriteColor,
                1,
                0.5
            );
            this.helper.userData.isLightHelper = true;
            this.container.add(this.helper);
        }

        if (this.helper) {
            this.helper.visible = false;
        }
    }

    setEditorVisibility(visible) {
        if (this.sprite) this.sprite.visible = visible;
    }

    setHelperVisibility(visible) {
        if (this.helper) this.helper.visible = visible;
    }

    setFlickering(enabled, speed = 0.1, intensity = 0.3) {
        // Backwards-compatible wrapper that uses new effect API
        this.flickering = enabled;
        this.flickerSpeed = speed;
        this.flickerIntensity = intensity;
        if (enabled) this.setEffect('flicker', speed, intensity);
        else this.setEffect('none', 0, 0);
    }

    // New API to set lighting effect
    setEffect(type = 'none', speed = 0.1, intensity = 0.3) {
        this.effectType = type || 'none';
        this.effectSpeed = speed ?? 0.1;
        this.effectIntensity = intensity ?? 0.3;
        // keep legacy fields in sync for older UIs
        this.flickering = (this.effectType === 'flicker');
        this.flickerSpeed = this.effectSpeed;
        this.flickerIntensity = this.effectIntensity;
        this.baseIntensity = this.config.intensity;
        this._effectTime = 0;
    }

    update(deltaTime) {
        if (this.effectType && this.effectType !== 'none') {
            this._effectTime += deltaTime * Math.max(0.0001, this.effectSpeed * 10);
            let multiplier = 1;
            const t = this._effectTime;

            switch (this.effectType) {
                case 'flicker':
                    multiplier = 1 + (Math.sin(t * 20) + Math.sin(t * 7.3)) * (this.effectIntensity * 0.5);
                    break;
                case 'pulse':
                    multiplier = 1 + Math.sin(t * Math.PI * 2) * (this.effectIntensity * 0.5);
                    break;
                case 'strobe':
                    multiplier = (Math.sin(t * Math.PI * 20) > 0.7) ? 1 + this.effectIntensity : 1;
                    break;
                case 'noise':
                    // cheap pseudo-random noise using sine + fractalization
                    multiplier = 1 + (Math.sin(t * 12.7) * 0.5 + Math.sin(t * 5.3) * 0.25) * this.effectIntensity;
                    break;
                default:
                    multiplier = 1;
            }

            this.light.intensity = Math.max(0, this.baseIntensity * multiplier);
        } else if (this.flickering) {
            // legacy behavior preserved (kept but routed to new effect system)
            this._effectTime += deltaTime * this.flickerSpeed * 10;
            const flicker = Math.sin(this._effectTime) * Math.sin(this._effectTime * 1.7) * this.flickerIntensity;
            this.light.intensity = this.baseIntensity * (1 + flicker);
        } else {
            this.light.intensity = this.baseIntensity;
        }
    }

    setColor(color) {
        this.config.color = color;
        this.light.color.setHex(color);
    }

    setIntensity(intensity) {
        this.config.intensity = intensity;
        this.baseIntensity = intensity;
        if (!this.flickering) {
            this.light.intensity = intensity;
        }
    }

    setDistance(distance) {
        if (this.config.type === 'point') {
            this.config.distance = distance;
            this.light.distance = distance;

            // Update helper
            if (this.helper) {
                this.helper.geometry.dispose();
                this.helper.geometry = new THREE.SphereGeometry(distance, 16, 16);
            }
        }
    }

    setDecay(decay) {
        if (this.config.type === 'point') {
            this.config.decay = decay;
            this.light.decay = decay;
        }
    }

    serialize() {
        return {
            name: this.name,
            type: 'light',
            config: { ...this.config },
            flickering: this.flickering,
            flickerSpeed: this.flickerSpeed,
            flickerIntensity: this.flickerIntensity,
            // New effect fields
            effectType: this.effectType,
            effectSpeed: this.effectSpeed,
            effectIntensity: this.effectIntensity
        };
    }

    static deserialize(data) {
        const lightObj = new LightObject(data.config, data.name);
        // restore legacy flicker if present
        if (data.flickering) {
            lightObj.setFlickering(true, data.flickerSpeed ?? 0.1, data.flickerIntensity ?? 0.3);
        }
        // prefer new effect fields if present
        if (data.effectType) {
            lightObj.setEffect(data.effectType, data.effectSpeed ?? 0.1, data.effectIntensity ?? 0.3);
        }
        return lightObj;
    }

    dispose() {
        if (this.sprite) {
            this.sprite.material.map.dispose();
            this.sprite.material.dispose();
        }
        if (this.helper) {
            if (this.helper.geometry) this.helper.geometry.dispose();
            if (this.helper.material) this.helper.material.dispose();
        }
    }
}