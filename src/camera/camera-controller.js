import * as THREE from 'three';
import { CameraBounds } from './camera-bounds.js';
import { CameraTransitions } from './camera-transitions.js';

export class CameraController {
    constructor(camera, container, inputFocusManager) {
        this.camera = camera;
        this.container = container;
        this.inputFocusManager = inputFocusManager;
        
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // Initialize camera with top-down angled view aligned to grid
        this.rotation = { x: -Math.PI / 3, y: 0 };
        this.camera.rotation.order = 'YXZ';
        this.updateCameraRotation();
        
        this.isRightMouseDown = false;
        this.isMiddleMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.moveSpeed = 0.5;
        this.rotateSpeed = 0.003;
        this.zoomSpeed = 2.5; // increased from 0.5 -> faster scroll zoom
        
        this.bounds = new CameraBounds(this);
        this.transitions = new CameraTransitions(this);
        
        this.isOrthographic = false;
        this.perspectiveCamera = camera;
        this.orthographicCamera = null;
        
        this.savedState = null;
    }

    handleKeyDown(event) {
        const blockMove = this.inputFocusManager?.isTextInputFocused?.();
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                if (!blockMove) this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (!blockMove) this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                if (!blockMove) this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                if (!blockMove) this.keys.right = true;
                break;
            case 'Equal':
            case 'NumpadAdd':
                this.adjustSpeed(0.1);
                break;
            case 'Minus':
            case 'NumpadSubtract':
                this.adjustSpeed(-0.1);
                break;
        }
    }

    handleKeyUp(event) {
        const blockMove = this.inputFocusManager?.isTextInputFocused?.();
        switch(event.code) {
            case 'KeyW':
            case 'ArrowUp':
                if (!blockMove) this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                if (!blockMove) this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                if (!blockMove) this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                if (!blockMove) this.keys.right = false;
                break;
        }
    }

    handleMouseDown(event) {
        if (event.button === 2) {
            this.isRightMouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        } else if (event.button === 1) {
            this.isMiddleMouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }

    handleMouseUp(event) {
        if (event.button === 2) {
            this.isRightMouseDown = false;
        } else if (event.button === 1) {
            this.isMiddleMouseDown = false;
        }
    }

    handleMouseMove(event) {
        if (this.isRightMouseDown) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            this.rotation.y -= deltaX * this.rotateSpeed;
            this.rotation.x -= deltaY * this.rotateSpeed;
            this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x));
            
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        } else if (this.isMiddleMouseDown) {
            const deltaX = event.clientX - this.lastMouseX;
            const deltaY = event.clientY - this.lastMouseY;
            
            const right = new THREE.Vector3();
            this.camera.getWorldDirection(new THREE.Vector3());
            right.crossVectors(this.camera.up, new THREE.Vector3(0, 0, -1)).normalize();
            
            this.camera.position.x -= right.x * deltaX * 0.01;
            this.camera.position.z -= right.z * deltaX * 0.01;
            this.camera.position.y += deltaY * 0.01;
            
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
        }
    }

    handleWheel(event) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // stronger per-wheel multiplier combined with increased zoomSpeed for noticeably faster zoom
        const distance = event.deltaY * -0.002 * this.zoomSpeed;
        this.camera.position.addScaledVector(direction, distance);
    }

    adjustSpeed(delta) {
        this.moveSpeed = Math.max(0.1, Math.min(2.0, this.moveSpeed + delta));
        window.dispatchEvent(new CustomEvent('cameraSpeedChanged', { 
            detail: { speed: this.moveSpeed } 
        }));
    }

    setSpeed(speed) {
        this.moveSpeed = Math.max(0.1, Math.min(2.0, speed));
    }

    updateCameraRotation() {
        this.camera.rotation.y = this.rotation.y;
        this.camera.rotation.x = this.rotation.x;
    }

    update() {
        // Don't update camera if cinematic mode is playing
        const cinematicPlaying = window.cinematicManager?.timeline?.isPlaying;
        if (cinematicPlaying) {
            return;
        }

        if (this.transitions.isTransitioning) {
            this.transitions.update();
            return;
        }

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();
        
        const right = new THREE.Vector3();
        right.crossVectors(this.camera.up, direction).normalize();
        
        if (this.keys.forward) {
            this.camera.position.addScaledVector(direction, this.moveSpeed);
        }
        if (this.keys.backward) {
            this.camera.position.addScaledVector(direction, -this.moveSpeed);
        }
        if (this.keys.left) {
            this.camera.position.addScaledVector(right, this.moveSpeed);
        }
        if (this.keys.right) {
            this.camera.position.addScaledVector(right, -this.moveSpeed);
        }
        
        this.bounds.apply();
        this.updateCameraRotation();
    }
    
    saveState() {
        this.savedState = this.getCameraState();
    }

    restoreState() {
        if (this.savedState) {
            this.setCameraState(this.savedState);
            this.savedState = null;
        }
    }

    focusOnObject(object) {
        if (!object) return;
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        const targetPosition = center.clone().sub(direction.multiplyScalar(distance));
        targetPosition.y = Math.max(targetPosition.y, center.y + 5);
        
        this.transitions.transitionTo(targetPosition, this.rotation);
    }

    toggleOrthographic(sceneManager) {
        this.isOrthographic = !this.isOrthographic;
        
        if (this.isOrthographic) {
            if (!this.orthographicCamera) {
                const aspect = this.container.clientWidth / this.container.clientHeight;
                const frustumSize = 20;
                this.orthographicCamera = new THREE.OrthographicCamera(
                    -frustumSize * aspect / 2, frustumSize * aspect / 2,
                    frustumSize / 2, -frustumSize / 2,
                    0.1, 1000
                );
                // Position for a true top-down view
                this.orthographicCamera.position.set(0, 50, 0);
                this.orthographicCamera.lookAt(0, 0, 0);
            }
            
            this.orthographicCamera.position.copy(this.perspectiveCamera.position);
            this.orthographicCamera.rotation.copy(this.perspectiveCamera.rotation);
            sceneManager.setCamera(this.isOrthographic ? this.orthographicCamera : this.perspectiveCamera);
            this.camera = sceneManager.camera;
        } else {
            // Restore perspective camera state
            this.perspectiveCamera.position.copy(this.camera.position);
            this.perspectiveCamera.rotation.copy(this.camera.rotation);
            sceneManager.setCamera(this.isOrthographic ? this.orthographicCamera : this.perspectiveCamera);
            this.camera = sceneManager.camera;
        }
        
        window.dispatchEvent(new CustomEvent('cameraTypeChanged', {
            detail: { isOrthographic: this.isOrthographic }
        }));
    }

    getCameraState() {
        return {
            position: this.camera.position.clone(),
            rotation: { ...this.rotation },
            isOrthographic: this.isOrthographic
        };
    }

    setCameraState(state) {
        this.transitions.transitionTo(state.position, state.rotation);
        if (state.isOrthographic !== this.isOrthographic) {
            // Handle orthographic toggle if needed
        }
    }
}