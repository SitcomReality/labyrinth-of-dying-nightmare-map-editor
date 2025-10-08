import * as THREE from 'three';

export function updatePlacementPlane(tool) {
  tool.placementPlane.setComponents(0, 1, 0, -tool.placementPlaneHeight);
}

export function updateGhostPosition(tool) {
  if (!tool.ghostObject) return;
  tool.raycaster.setFromCamera(tool.mouse, tool.sceneManager.camera);
  // Ensure we use the actual Three.js container/group when available.
  const ghostContainer = (tool.isLightAsset || tool.isTextAsset || tool.isShapeAsset)
    ? tool.ghostObject.container
    : (tool.ghostObject && tool.ghostObject.container) ? tool.ghostObject.container : tool.ghostObject;

  if (tool.isSurfaceSnapActive) {
    // Guard against malformed map entries where o.object may be undefined/null
    const objs = tool.mapManager.objects
      .map(o => {
        if (!o || !o.object) return null;
        if (o.type === 'light' || o.type === 'text' || o.type === 'shape') return o.object.container;
        // Check if object is a valid THREE.Object3D before returning it
        if (o.object && typeof o.object.isObject3D !== 'undefined' && o.object.isObject3D) {
             return o.object;
        }
        return null;
      })
      // Only keep real THREE.Object3D instances and exclude the ghost itself
      .filter(o => o && o !== ghostContainer && typeof o.isObject3D !== 'undefined' && o.isObject3D);

    const hits = tool.raycaster.intersectObjects(objs, true);
    if (hits.length > 0) {
      const it = hits[0];
      const p = it.point.clone();
      const n = it.face.normal.clone();
      n.transformDirection(it.object.matrixWorld).normalize();
      ghostContainer.position.copy(p);
      ghostContainer.position.addScaledVector(n, tool.heightOffset);
      orientOnSurface(tool, ghostContainer, n);
      return;
    }
  }

  const intersection = new THREE.Vector3();
  tool.raycaster.ray.intersectPlane(tool.placementPlane, intersection);
  if (intersection) {
    tool.snapPosition(intersection);
    ghostContainer.position.copy(intersection);
    ghostContainer.rotation.set(0, tool.rotation, 0);
  }
}

export function orientOnSurface(tool, container, normal) {
  const type = classifySurface(normal);
  container.rotation.set(0, 0, 0);
  if (type === 'wall') {
    container.rotation.y = Math.atan2(normal.x, normal.z);
    const offset = tool.assetSize.z / 2;
    container.position.addScaledVector(normal, offset + 0.01);
  } else if (type === 'ceiling') {
    container.rotation.x = Math.PI;
    container.rotation.y = tool.rotation;
  } else {
    container.rotation.y = tool.rotation;
  }
}

function classifySurface(normal) {
  const upDot = normal.dot(new THREE.Vector3(0, 1, 0));
  const absDot = Math.abs(upDot);
  if (absDot > 0.9) return upDot > 0 ? 'floor' : 'ceiling';
  if (absDot < 0.1) return 'wall';
  return 'slope';
}