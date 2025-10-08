import * as THREE from 'three';

export class SurfaceDetector {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.raycaster = new THREE.Raycaster();
    }

    detectSurface(position, objects = null) {
        const rayOrigin = position.clone();
        rayOrigin.y += 10; // Start above the position

        const rayDirection = new THREE.Vector3(0, -1, 0);
        this.raycaster.set(rayOrigin, rayDirection);

        const intersects = this.raycaster.intersectObjects(
            objects || this.sceneManager.objects, 
            true
        );

        if (intersects.length > 0) {
            return {
                point: intersects[0].point,
                normal: intersects[0].face.normal.clone(),
                object: intersects[0].object,
                type: this.classifySurface(intersects[0].face.normal)
            };
        }

        return null;
    }

    classifySurface(normal) {
        const upDot = normal.dot(new THREE.Vector3(0, 1, 0));
        const absDot = Math.abs(upDot);

        if (absDot > 0.9) {
            return upDot > 0 ? 'floor' : 'ceiling';
        } else if (absDot < 0.1) {
            return 'wall';
        }

        return 'slope';
    }

    getWallNormal(position, objects = null) {
        const directions = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, -1)
        ];

        for (const direction of directions) {
            this.raycaster.set(position, direction);
            const intersects = this.raycaster.intersectObjects(
                objects || this.sceneManager.objects,
                true
            );

            if (intersects.length > 0 && intersects[0].distance < 2) {
                return {
                    normal: intersects[0].face.normal.clone(),
                    distance: intersects[0].distance,
                    point: intersects[0].point
                };
            }
        }

        return null;
    }

    alignToSurface(rotation, surfaceNormal, surfaceType) {
        if (surfaceType === 'floor' || surfaceType === 'ceiling') {
            // Keep rotation around Y axis only
            return rotation;
        } else if (surfaceType === 'wall') {
            // Align to wall normal
            const angle = Math.atan2(surfaceNormal.x, surfaceNormal.z);
            return angle;
        }

        return rotation;
    }
}