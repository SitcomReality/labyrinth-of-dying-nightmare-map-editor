import * as THREE from 'three';

export class CameraPresets {
    constructor(cameraController) {
        this.cameraController = cameraController;
        this.presets = new Map();
        this.loadPresets();
    }

    savePreset(name) {
        const state = this.cameraController.getCameraState();
        this.presets.set(name, state);
        this.saveToLocalStorage();
        window.dispatchEvent(new CustomEvent('cameraPresetsChanged'));
    }

    loadPreset(name) {
        const state = this.presets.get(name);
        if (state) {
            this.cameraController.setCameraState(state);
        }
    }

    deletePreset(name) {
        this.presets.delete(name);
        this.saveToLocalStorage();
        window.dispatchEvent(new CustomEvent('cameraPresetsChanged'));
    }

    getAllPresets() {
        return Array.from(this.presets.keys());
    }

    saveToLocalStorage() {
        const data = {};
        this.presets.forEach((state, name) => {
            data[name] = {
                position: {
                    x: state.position.x,
                    y: state.position.y,
                    z: state.position.z
                },
                rotation: state.rotation,
                isOrthographic: state.isOrthographic
            };
        });
        localStorage.setItem('cameraPresets', JSON.stringify(data));
    }

    loadPresets() {
        const data = localStorage.getItem('cameraPresets');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                Object.keys(parsed).forEach(name => {
                    const state = parsed[name];
                    this.presets.set(name, {
                        position: new THREE.Vector3(
                            state.position.x,
                            state.position.y,
                            state.position.z
                        ),
                        rotation: state.rotation,
                        isOrthographic: state.isOrthographic
                    });
                });
            } catch (e) {
                console.error('Failed to load camera presets:', e);
            }
        }
    }
}