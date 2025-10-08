import * as THREE from 'three';

export class RotationGizmo {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.targetObject = null;
        this.container = new THREE.Group();
        this.isActive = false;
        this.isDragging = false;
        this.activeAxis = null;
        this.snapToAngle = false;
        this.snapIncrement = Math.PI / 4; // 45 degrees

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.startAngle = 0;
        this.currentAngle = 0;

        this.createGizmo();
    }

    createGizmo() {
        // Y-axis (azimuth) ring - horizontal rotation
        this.yAxisRing = this.createAxisRing(0xff9500, 'y');
        this.container.add(this.yAxisRing);

        // X-axis (altitude) ring - pitch rotation
        this.xAxisRing = this.createAxisRing(0x00ff95, 'x');
        this.xAxisRing.rotation.z = Math.PI / 2;
        this.container.add(this.xAxisRing);

        // Center sphere to show rotation center - much larger
        const centerGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const centerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        this.centerSphere = new THREE.Mesh(centerGeometry, centerMaterial);
        this.container.add(this.centerSphere);

        this.container.renderOrder = 999;
        this.container.visible = false;
    }

    createAxisRing(color, axis) {
        const group = new THREE.Group();
        group.userData.axis = axis;

        // Create ring geometry - thicker for visibility
        const ringGeometry = new THREE.TorusGeometry(2.5, 0.06, 16, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.7,
            depthTest: false
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.userData.axis = axis;
        ring.userData.isGizmo = true;
        group.add(ring);

        // Create interactive thick ring for easier clicking - much larger hit area
        const hitGeometry = new THREE.TorusGeometry(2.5, 0.4, 16, 64);
        const hitMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0,
            depthTest: false
        });
        const hitRing = new THREE.Mesh(hitGeometry, hitMaterial);
        hitRing.userData.axis = axis;
        hitRing.userData.isGizmo = true;
        hitRing.userData.isHitArea = true;
        group.add(hitRing);

        return group;
    }

    attachTo(object) {
        this.targetObject = object;
        if (object) {
            this.container.position.copy(object.position);
            this.sceneManager.scene.add(this.container);
            this.container.visible = true;
            this.isActive = true;
            this.updateRingOrientations();
        } else {
            this.hide();
        }
    }

    hide() {
        this.container.visible = false;
        this.isActive = false;
        this.targetObject = null;
        if (this.container.parent) {
            this.sceneManager.scene.remove(this.container);
        }
    }

    setSnapToAngle(enabled) {
        this.snapToAngle = enabled;
    }

    updateMousePosition(event, containerElement) {
        const rect = containerElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    handleMouseDown(event, camera, containerElement) {
        if (!this.isActive || event.button !== 0) return false;

        this.updateMousePosition(event, containerElement);
        this.raycaster.setFromCamera(this.mouse, camera);

        const intersects = this.raycaster.intersectObjects(this.container.children, true);

        for (let intersect of intersects) {
            if (intersect.object.userData.isGizmo) {
                this.isDragging = true;
                this.activeAxis = intersect.object.userData.axis;

                // Highlight active ring
                this.highlightAxis(this.activeAxis);

                // Calculate start angle
                this.startAngle = this.getAngleFromMouse(camera, this.activeAxis);
                this.currentAngle = this.targetObject.rotation[this.activeAxis];

                return true;
            }
        }

        return false;
    }

    handleMouseMove(event, camera, containerElement) {
        if (!this.isActive) return;

        this.updateMousePosition(event, containerElement);

        if (this.isDragging && this.activeAxis && this.targetObject) {
            const newAngle = this.getAngleFromMouse(camera, this.activeAxis);
            let deltaAngle = newAngle - this.startAngle;

            let targetRotation = this.currentAngle + deltaAngle;

            // Apply snapping if enabled
            if (this.snapToAngle) {
                targetRotation = Math.round(targetRotation / this.snapIncrement) * this.snapIncrement;
            }

            this.targetObject.rotation[this.activeAxis] = targetRotation;

            // Update ring orientations when rotating
            this.updateRingOrientations();

            // Emit rotation change event
            window.dispatchEvent(new CustomEvent('gizmoRotationChanged', {
                detail: { 
                    axis: this.activeAxis,
                    rotation: targetRotation
                }
            }));
        } else {
            // Highlight ring on hover
            this.raycaster.setFromCamera(this.mouse, camera);
            const intersects = this.raycaster.intersectObjects(this.container.children, true);

            let hoveredAxis = null;
            for (let intersect of intersects) {
                if (intersect.object.userData.isGizmo) {
                    hoveredAxis = intersect.object.userData.axis;
                    break;
                }
            }

            if (hoveredAxis) {
                this.highlightAxis(hoveredAxis, 0.5);
            } else {
                this.clearHighlight();
            }
        }
    }

    handleMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.activeAxis = null;
            this.clearHighlight();
            return true;
        }
        return false;
    }

    getAngleFromMouse(camera, axis) {
        // Project mouse onto the plane of rotation
        const plane = new THREE.Plane();
        const intersection = new THREE.Vector3();

        if (axis === 'y') {
            plane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 1, 0),
                this.container.position
            );
        } else if (axis === 'x') {
            plane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(1, 0, 0),
                this.container.position
            );
        }

        this.raycaster.setFromCamera(this.mouse, camera);
        this.raycaster.ray.intersectPlane(plane, intersection);

        if (intersection) {
            const offset = intersection.sub(this.container.position);
            if (axis === 'y') {
                return Math.atan2(offset.x, offset.z);
            } else if (axis === 'x') {
                return Math.atan2(offset.z, offset.y);
            }
        }

        return 0;
    }

    updateRingOrientations() {
        if (!this.targetObject) return;
        
        // Make the X-axis ring follow the Y-axis rotation so it stays aligned
        // Copy the object's Y rotation to the X ring's Y rotation
        this.xAxisRing.rotation.y = this.targetObject.rotation.y;
    }

    highlightAxis(axis, opacity = 0.95) {
        this.clearHighlight();

        const ring = axis === 'y' ? this.yAxisRing : this.xAxisRing;
        ring.children.forEach(child => {
            if (child.isMesh && !child.userData.isHitArea) {
                child.material.opacity = opacity;
            }
        });
    }

    clearHighlight() {
        [this.yAxisRing, this.xAxisRing].forEach(ring => {
            ring.children.forEach(child => {
                if (child.isMesh && !child.userData.isHitArea) {
                    child.material.opacity = 0.7;
                }
            });
        });
    }

    update() {
        if (this.targetObject && this.isActive) {
            this.container.position.copy(this.targetObject.position);
            this.updateRingOrientations();
        }
    }
}