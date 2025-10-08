export class LightController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.lights = [];
        this.editorMode = true;
    }
    
    addLight(lightObject) {
        this.lights.push(lightObject);
        this.sceneManager.scene.add(lightObject.container);
        lightObject.setEditorVisibility(this.editorMode);
        return lightObject;
    }
    
    removeLight(lightObject) {
        const index = this.lights.indexOf(lightObject);
        if (index > -1) {
            this.lights.splice(index, 1);
            this.sceneManager.scene.remove(lightObject.container);
            lightObject.dispose();
        }
    }
    
    setEditorMode(enabled) {
        this.editorMode = enabled;
        this.lights.forEach(light => {
            light.setEditorVisibility(enabled);
        });
    }
    
    showHelpers(lightObject) {
        // Hide all other helpers
        this.lights.forEach(light => {
            light.setHelperVisibility(false);
        });
        // Show this light's helper
        if (lightObject) {
            lightObject.setHelperVisibility(true);
        }
    }
    
    hideHelpers() {
        this.lights.forEach(light => {
            light.setHelperVisibility(false);
        });
    }
    
    update(deltaTime) {
        this.lights.forEach(light => {
            light.update(deltaTime);
        });
    }
    
    clear() {
        this.lights.forEach(light => {
            this.sceneManager.scene.remove(light.container);
            light.dispose();
        });
        this.lights = [];
    }
}