import * as THREE from 'three';

export class BaseTool {
    constructor(sceneManager, inputManager) {
        this.sceneManager = sceneManager;
        this.inputManager = inputManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.snapToGrid = false;
        this.highlightedObject = null;
        this.highlightColor = 0x4a9eff; // Default blue, can be overridden
        this.outlineMaterial = new THREE.MeshBasicMaterial({
            color: this.highlightColor,
            transparent: true,
            opacity: 0.3,
            depthTest: false
        });
    }

    activate() {}
    deactivate() {}

    setSnapToGrid(enabled) {
        this.snapToGrid = enabled;
    }
    
    updateHighlightMaterial() {
        this.outlineMaterial.color.setHex(this.highlightColor);
    }

    updateMousePosition(event) {
        const rect = this.sceneManager.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    raycast(objects = this.sceneManager.objects) {
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        const lightContainers = (window.app?.lightController?.lights || []).map(l => l.container).filter(Boolean);
        const textContainers = (window.app?.textController?.texts || []).map(t => t.container).filter(Boolean);
        const shapeContainers = (window.app?.shapeController?.shapes || []).map(s => s.container).filter(Boolean);
        const connectorContainers = (window.app?.connectorController?.connectors || []).map(c => c.container).filter(Boolean);
        
        const pickables = [...objects, ...lightContainers, ...textContainers, ...shapeContainers, ...connectorContainers];
        
        // Only pass valid THREE.Object3D instances to three.js raycaster to avoid errors
        const validPickables = pickables.filter(o => o && o.isObject3D);
        return this.raycaster.intersectObjects(validPickables, true);
    }

    snapPosition(position) {
        if (this.snapToGrid) {
            position.x = Math.round(position.x);
            position.y = Math.round(position.y);
            position.z = Math.round(position.z);
        }
        return position;
    }

    highlightObject(object) {
        this.clearHighlight();
        if (!object) return;
        
        // Check if it's a light sprite, text sprite, shape sprite or helper - get parent container
        if (object.userData && (object.userData.isLightSprite || object.userData.isTextSprite || object.userData.isLightHelper || object.userData.isShapeSprite || object.userData.isConnectorSprite)) {
            object = object.parent;
        }
        
        while (object.parent && object.parent !== this.sceneManager.scene) {
            object = object.parent;
        }
        
        this.highlightedObject = object;
        object.traverse((node) => {
            if (node.isMesh && node.userData.originalMaterial === undefined) {
                const original = node.material;
                node.userData.originalMaterial = original;
                const makeHighlight = (mat) => {
                    const c = mat && mat.clone ? mat.clone() : mat;
                    if (c && 'emissive' in c) { 
                        c.emissive = new THREE.Color(this.highlightColor); 
                        c.emissiveIntensity = 0.3; 
                    }
                    return c;
                };
                node.material = Array.isArray(original) ? original.map(makeHighlight) : makeHighlight(original);
            }
            // Also highlight sprites
            if (node.isSprite && node.userData.originalMaterial === undefined) {
                const original = node.material;
                node.userData.originalMaterial = original;
                const c = original.clone();
                c.color = new THREE.Color(this.highlightColor);
                node.material = c;
            }
        });
    }

    clearHighlight() {
        if (this.highlightedObject) {
            this.highlightedObject.traverse((node) => {
                if (node.userData.originalMaterial) {
                    node.material = node.userData.originalMaterial;
                    delete node.userData.originalMaterial;
                }
            });
            this.highlightedObject = null;
        }
    }
}