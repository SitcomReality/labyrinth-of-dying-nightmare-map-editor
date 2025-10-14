export class CameraTransitions {
    constructor(cameraController) {
        this.cameraController = cameraController;
        this.isTransitioning = false;
        this.startPosition = null;
        this.targetPosition = null;
        this.startRotation = null;
        this.targetRotation = null;
        this.transitionProgress = 0;
        this.transitionDuration = 0.5;
    }

    transitionTo(targetPosition, targetRotation) {
        this.isTransitioning = true;
        this.startPosition = this.cameraController.camera.position.clone();
        this.targetPosition = targetPosition;
        this.startRotation = { ...this.cameraController.rotation };
        this.targetRotation = targetRotation || this.startRotation;
        this.transitionProgress = 0;
    }

    update() {
        if (!this.isTransitioning) return;
        
        this.transitionProgress += 0.016 / this.transitionDuration;
        
        if (this.transitionProgress >= 1) {
            this.cameraController.camera.position.copy(this.targetPosition);
            this.cameraController.rotation = { ...this.targetRotation };
            this.isTransitioning = false;
            return;
        }
        
        const t = this.easeInOutCubic(this.transitionProgress);
        
        this.cameraController.camera.position.lerpVectors(
            this.startPosition,
            this.targetPosition,
            t
        );
        
        this.cameraController.rotation.x = this.lerp(
            this.startRotation.x,
            this.targetRotation.x,
            t
        );
        this.cameraController.rotation.y = this.lerp(
            this.startRotation.y,
            this.targetRotation.y,
            t
        );
    }

    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    lerp(start, end, t) {
        return start + (end - start) * t;
    }
}

