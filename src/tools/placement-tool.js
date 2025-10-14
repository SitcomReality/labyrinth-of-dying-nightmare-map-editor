import { BaseTool } from './base-tool.js';
import * as THREE from 'three';
import { RotationIndicator } from './widgets/rotation-indicator.js';
import { updateGhostPosition, updatePlacementPlane } from './placement/positioning.js';
import { PlacementState } from './placement/state.js';
import { setAsset, placeObject, cancel, clearGhost } from './placement/placement-logic.js';

export class PlacementTool extends BaseTool {
    constructor(sceneManager, inputManager, mapManager, historyManager) {
        super(sceneManager, inputManager);
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        
        this.ghostObject = null;
        this.assetName = null;
        this.isLightAsset = false;
        this.isTextAsset = false;
        this.assetSize = new THREE.Vector3();
        
        this.isDragging = false;
        this.dragStartPos = null;
        this.lockedPosition = null;
        this.rotation = 0;
        this.startRotation = 0;
        this.snapIncrement = Math.PI / 4;
        
        this.originalState = null;
        this.isFromPickup = false;
        this.pickedUpProperties = null;

        this.rotationIndicator = new RotationIndicator(sceneManager);
        this.tooltip = document.getElementById('placement-tooltip');
        this.tooltipTimeout = null;
        
        this.paintMode = false;
        this.heightOffset = 0;
        this.placementPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.placementPlaneHeight = 0;
        this.isSurfaceSnapActive = false;

        this.state = new PlacementState();

        this.isConnectorAsset = false; // added: track connector ghosts like other special assets
        this.isNpcAsset = false;
        
        // NEW PROPERTIES for map piece conventions & flipping
        this.isMapPieceAsset = false;
        this.cornerOffset = new THREE.Vector3();
        this.flipX = false;
        this.flipZ = false;

        this.handleFlipKeysBound = this.handleFlipKeys.bind(this);
    }
    
    activate() {
        super.activate();
        window.addEventListener('keydown', this.handleFlipKeysBound);
    }
    
    handleFlipKeys(event) {
        if (!this.ghostObject || window.app?.inputFocusManager?.isTextInputFocused()) return;

        let changed = false;
        
        // ALT + X: Flip X (Mirror)
        if (event.altKey && (event.key === 'x' || event.key === 'X')) {
             event.preventDefault();
             this.flipX = !this.flipX;
             changed = true;
        }
        
        // ALT + Z: Flip Z (Depth)
        if (event.altKey && (event.key === 'z' || event.key === 'Z')) {
             event.preventDefault();
             this.flipZ = !this.flipZ;
             changed = true;
        }
        
        if (changed) {
             this.applyScale();
             this.updateGhostPosition(); // Re-calculate corner offset based on new flip state
             this.showFlipStatus();
        }
    }
    
    applyScale() {
        if (!this.ghostObject) return;
        const container = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset) ? this.ghostObject.container : this.ghostObject;

        // Apply scale to the container (which handles rotation correctly)
        container.scale.x = this.flipX ? -1 : 1;
        container.scale.z = this.flipZ ? -1 : 1;
    }
    
    showFlipStatus() {
         clearTimeout(this.tooltipTimeout);
         this.tooltip.textContent = `Flip X: ${this.flipX?'ON':'OFF'} | Flip Z: ${this.flipZ?'ON':'OFF'}`;
         this.tooltip.style.left = `50%`;
         this.tooltip.style.top = `50%`;
         this.tooltip.style.transform = 'translate(-50%, -50%)';
         this.tooltip.style.display = 'block';
         this.tooltipTimeout = setTimeout(() => { 
             if (!this.isDragging && !this.isSurfaceSnapActive) {
                 this.tooltip.style.display = 'none'; 
                 this.tooltip.style.transform = '';
             }
         }, 1500);
    }

    // Public methods for other tools
    setAsset(name, model) { setAsset.call(this, name, model); }
    setPickedUpAsset(assetName, model, properties) {
        this.isFromPickup = true;
        this.pickedUpProperties = properties;
        this.setAsset(assetName, model);
    }

    // Event handlers
    handleKeyDown(event) {
        if (event.key === 'Control' && !this.isSurfaceSnapActive) {
            this.isSurfaceSnapActive = true;
            this.heightOffset = 0;
            this.tooltip.textContent = `Surface Snap On`;
            this.tooltip.style.display = 'block';
            this.updateGhostPosition();
        }
    }
    handleKeyUp(event) {
        if (event.key === 'Control') {
            this.isSurfaceSnapActive = false;
            this.tooltip.style.display = 'none';
            this.updateGhostPosition();
        }
    }
    handleMouseMove(event) {
        if (!this.ghostObject) return;
        this.updateMousePosition(event);
        if (this.isDragging && this.lockedPosition) {
            this.handleRotationDrag(event);
        } else {
            this.updateGhostPosition();
            if (this.isSurfaceSnapActive) {
                this.tooltip.style.left = `${event.clientX + 15}px`;
                this.tooltip.style.top = `${event.clientY + 15}px`;
            } else {
                if (!this.tooltip.textContent.includes('Flip')) { 
                    this.tooltip.style.display = 'none';
                }
            }
        }
    }
    handleRotationDrag(event) {
        const container = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset) ? this.ghostObject.container : this.ghostObject;
        container.position.copy(this.lockedPosition);
        const deltaX = event.clientX - this.dragStartPos.x;
        let rotation = this.startRotation + (deltaX * 0.01);
        if (this.snapToGrid) {
            rotation = Math.round(rotation / this.snapIncrement) * this.snapIncrement;
        }
        this.rotation = rotation;
        container.rotation.y = this.rotation;
        this.rotationIndicator.updateRotation(this.rotation, this.startRotation);
        const degrees = Math.round((this.rotation * 180 / Math.PI) % 360);
        this.tooltip.textContent = `${degrees}°`;
        this.tooltip.style.left = `${event.clientX + 15}px`;
        this.tooltip.style.top = `${event.clientY + 15}px`;
        this.tooltip.style.display = 'block';
        this.updateGhostPosition();
    }
    handleMouseDown(event) {
        if (event.button === 0 && this.ghostObject) {
            event.preventDefault();
            event.stopPropagation();
            if (!this.isDragging) {
                this.isDragging = true;
                this.dragStartPos = { x: event.clientX, y: event.clientY };
                const container = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset) ? this.ghostObject.container : this.ghostObject;
                this.lockedPosition = container.position.clone();
                this.startRotation = this.rotation;
                this.rotationIndicator.show(this.lockedPosition);
                this.rotationIndicator.updateRotation(this.rotation, this.startRotation);
            }
        } else if (event.button === 2) {
            this.cancel();
        }
    }
    handleMouseUp(event) {
        if (event.button === 0 && this.isDragging) {
            event.preventDefault();
            event.stopPropagation();
            const dragDistance = Math.abs(event.clientX - this.dragStartPos.x);
            if (dragDistance < 5) { // Click
                this.paintMode = event.shiftKey;
                this.placeObject();
            }
            this.isDragging = false;
            this.dragStartPos = null;
            this.lockedPosition = null;
            this.rotationIndicator.hide();
            this.tooltip.style.display = 'none';
        }
    }
    handleWheel(event) {
        if (!this.ghostObject || this.isDragging) return;
        event.preventDefault();

        // When Shift is held, use wheel to tweak placement height in whole grid units (1 unit per notch)
        if (event.shiftKey) {
            const step = (event.deltaY < 0) ? 1 : -1;
            this.placementPlaneHeight += step;
            this.updatePlacementPlane();
            this.updateGhostPosition();
            this.tooltip.textContent = `Height: ${this.placementPlaneHeight.toFixed(2)}`;
            this.tooltip.style.left = `${event.clientX + 15}px`;
            this.tooltip.style.top = `${event.clientY + 15}px`;
            this.tooltip.style.display = 'block';
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = setTimeout(() => { if (!this.isDragging && !this.isSurfaceSnapActive) this.tooltip.style.display = 'none'; }, 1000);
            return;
        }
    }

    // Positioning helpers
    updatePlacementPlane() { updatePlacementPlane(this); }
    updateGhostPosition() { updateGhostPosition(this); }
    
    // Core logic
    placeObject() { placeObject.call(this); }
    cancel() { cancel.call(this); }
    clearGhost() { clearGhost.call(this); }
    deactivate() {
        this.clearGhost();
        this.isFromPickup = false;
        this.pickedUpProperties = null;
        window.removeEventListener('keydown', this.handleFlipKeysBound);
    }
}