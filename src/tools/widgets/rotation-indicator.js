import * as THREE from 'three';

export class RotationIndicator {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.container = new THREE.Group();
        this.visible = false;

        this.createIndicator();
    }

    createIndicator() {
        // Create rotation circle
        const circleGeometry = new THREE.RingGeometry(1.5, 1.55, 64);
        const circleMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthTest: false
        });
        this.circle = new THREE.Mesh(circleGeometry, circleMaterial);
        this.circle.rotation.x = -Math.PI / 2;
        this.container.add(this.circle);

        // Create rotation arc (shows current drag angle)
        const arcGeometry = new THREE.BufferGeometry();
        this.arcPositions = new Float32Array(200 * 3);
        arcGeometry.setAttribute('position', new THREE.BufferAttribute(this.arcPositions, 3));

        const arcMaterial = new THREE.LineBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8,
            linewidth: 3,
            depthTest: false
        });
        this.arc = new THREE.Line(arcGeometry, arcMaterial);
        this.container.add(this.arc);

        // Create direction line
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            0, 0.01, 0,
            0, 0.01, 1.6
        ], 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.9,
            linewidth: 2,
            depthTest: false
        });
        this.directionLine = new THREE.Line(lineGeometry, lineMaterial);
        this.container.add(this.directionLine);

        this.container.renderOrder = 999;
    }

    show(position) {
        this.container.position.copy(position);
        this.sceneManager.scene.add(this.container);
        this.visible = true;
    }

    hide() {
        if (this.container.parent) {
            this.sceneManager.scene.remove(this.container);
        }
        this.visible = false;
    }

    updateRotation(angle, startAngle = 0) {
        // Update direction line rotation
        this.directionLine.rotation.y = angle;

        // Update arc from startAngle to angle
        const arcAngle = angle - startAngle;
        const segments = 64;
        const radius = 1.5;

        for (let i = 0; i <= segments; i++) {
            const theta = startAngle + (arcAngle * i / segments);
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;

            this.arcPositions[i * 3] = x;
            this.arcPositions[i * 3 + 1] = 0.01;
            this.arcPositions[i * 3 + 2] = z;
        }

        this.arc.geometry.attributes.position.needsUpdate = true;
        this.arc.geometry.setDrawRange(0, segments + 1);
    }

    setPosition(position) {
        this.container.position.copy(position);
    }
}