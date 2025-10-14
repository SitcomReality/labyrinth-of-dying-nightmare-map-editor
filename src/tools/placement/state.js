export class PlacementState {
  constructor() { this.reset(); }
  reset() {
    this.isDragging = false;
    this.dragStartPos = null;
    this.lockedPosition = null;
    this.rotation = 0;
    this.startRotation = 0;
    this.paintMode = false;
    this.heightOffset = 0;
    this.placementPlaneHeight = 0;
    this.isSurfaceSnapActive = false;
  }
}

