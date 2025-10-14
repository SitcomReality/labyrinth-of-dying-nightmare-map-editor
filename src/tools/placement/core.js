import { createGhost, disposeGhost } from './ghost-factory.js';
import * as THREE from 'three';
import { isMapPiece as _isMapPiece } from './placement-helpers.js';

// wrapper to expose helper under consistent name
function isMapPiece(assetName) {
  return _isMapPiece(assetName);
}

export async function setAsset(name, model) {
  // clear any existing ghost first
  if (this.clearGhost) this.clearGhost();

  this.assetName = name;
  this.state.heightOffset = 0;

  const { ghost, isLight, isText, isShape, isConnector, isNpc } = await createGhost(model, this.sceneManager);
  this.ghostObject = ghost;
  this.isLightAsset = !!isLight;
  this.isTextAsset = !!isText;
  this.isShapeAsset = !!isShape;
  this.isConnectorAsset = !!isConnector;
  this.isNpcAsset = !!isNpc;

  this.isMapPieceAsset = isMapPiece(name);

  const container = (this.isLightAsset || this.isTextAsset || this.isShapeAsset || this.isConnectorAsset || this.isNpcAsset)
    ? this.ghostObject.container
    : (this.ghostObject && this.ghostObject.container) ? this.ghostObject.container : this.ghostObject;

  const box = new THREE.Box3().setFromObject(container);
  this.assetSize.copy(box.getSize(new THREE.Vector3()));

  this.cornerOffset.set(0, 0, 0);
  if (this.isMapPieceAsset) {
    // Align corner offset so pieces snap to grid/corners
    this.cornerOffset.set(-box.min.x, 0, -box.min.z);
  }

  if (this.pickedUpProperties) {
    // Restore picked-up transform/properties
    const props = this.pickedUpProperties;
    container.position.copy(props.position || new THREE.Vector3());
    container.rotation.copy(props.rotation || new THREE.Euler());
    this.rotation = (props.rotation && props.rotation.y) ? props.rotation.y : 0;
    this.flipX = props.scaleX === -1;
    this.flipZ = props.scaleZ === -1;
  } else {
    this.rotation = 0;
    this.flipX = false;
    this.flipZ = false;
  }

  // Apply initial flip/scale state and recalc asset size
  this.applyScale?.();
  this.assetSize.copy(new THREE.Box3().setFromObject(container).getSize(new THREE.Vector3()));
}

export function clearGhost() {
  if (this.ghostObject) {
    disposeGhost(this.ghostObject, this.sceneManager, {
      isLight: this.isLightAsset,
      isText: this.isTextAsset,
      isShape: this.isShapeAsset,
      isConnector: this.isConnectorAsset,
      isNpc: this.isNpcAsset
    });
  }

  this.ghostObject = null;
  this.isLightAsset = false;
  this.isTextAsset = false;
  this.isShapeAsset = false;
  this.isConnectorAsset = false;
  this.isNpcAsset = false;

  this.isMapPieceAsset = false;
  if (this.cornerOffset && typeof this.cornerOffset.set === 'function') this.cornerOffset.set(0, 0, 0);
  this.flipX = false;
  this.flipZ = false;

  this.state.reset?.();
  this.rotationIndicator?.hide?.();
  if (this.tooltip) {
    this.tooltip.style.display = 'none';
  }
}