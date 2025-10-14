import * as THREE from 'three';

export function updatePlacementPlane(tool) {
  tool.placementPlane.setComponents(0, 1, 0, -tool.placementPlaneHeight);
}

export function updateGhostPosition(tool) {
  if (!tool.ghostObject) return;
  tool.raycaster.setFromCamera(tool.mouse, tool.sceneManager.camera);

  // If user is actively dragging to rotate, keep ghost fixed at lockedPosition/pivot
  if (tool.isDragging && tool.lockedPosition) {
    const ghostContainer = (tool.isLightAsset || tool.isTextAsset || tool.isShapeAsset || tool.isNpcAsset || tool.isConnectorAsset)
      ? tool.ghostObject.container
      : (tool.ghostObject && tool.ghostObject.container) ? tool.ghostObject.container : tool.ghostObject;
    ghostContainer.position.copy(tool.lockedPosition);
    ghostContainer.rotation.set(0, tool.rotation, 0);
    ghostContainer.visible = true;
    return;
  }

  // Ensure we use the actual Three.js container/group when available.
  const ghostContainer = (tool.isLightAsset || tool.isTextAsset || tool.isShapeAsset || tool.isNpcAsset || tool.isConnectorAsset)
    ? tool.ghostObject.container
    : (tool.ghostObject && tool.ghostObject.container) ? tool.ghostObject.container : tool.ghostObject;

  if (tool.isSurfaceSnapActive) {
    // Guard against malformed map entries where o.object may be undefined/null
    const objs = tool.mapManager.objects
      .map(o => {
        if (!o || !o.object) return null;
        if (o.type === 'light' || o.type === 'text' || o.type === 'shape' || o.type === 'npc' || o.type === 'connector') return o.object.container;
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
      
      // Lift slightly if placing on a surface to avoid z-fighting
      ghostContainer.position.addScaledVector(n, 0.01); 
      
      orientOnSurface(tool, ghostContainer, n);
      return;
    }
  }

  // --- Normal placement (on placement plane) ---
  const intersection = new THREE.Vector3();
  tool.raycaster.ray.intersectPlane(tool.placementPlane, intersection);
  
  if (intersection) {
    // 1. Apply grid snap to intersection point
    tool.snapPosition(intersection);

    // 2. Apply corner offset, rotated by current Y rotation and scaled by flip
    const rotationMatrix = new THREE.Matrix4().makeRotationY(tool.rotation);
    
    // Adjust corner offset by flip scale before rotation
    const scaledOffset = tool.cornerOffset.clone();
    scaledOffset.x *= tool.flipX ? -1 : 1;
    scaledOffset.z *= tool.flipZ ? -1 : 1;
    
    const rotatedOffset = scaledOffset.applyMatrix4(rotationMatrix);
    
    // 3. Set ghost position
    const finalPosition = intersection.add(rotatedOffset);
    // If this is a map piece (walls/foundations), force alignment to integer grid lines
    if (tool.isMapPieceAsset) {
      finalPosition.x = Math.round(finalPosition.x);
      finalPosition.z = Math.round(finalPosition.z);
    }
    ghostContainer.position.copy(finalPosition);
    ghostContainer.rotation.set(0, tool.rotation, 0);

    // 4. Enforce positive X/Z quadrant restriction for map pieces
    const intersectionX = intersection.x;
    const intersectionZ = intersection.z;
    
    if (tool.isMapPieceAsset) {
         if (intersectionX < -0.01 || intersectionZ < -0.01) {
             ghostContainer.visible = false;
         } else {
             ghostContainer.visible = true;
         }
    } else {
         // Details are not restricted to the quadrant
         ghostContainer.visible = true;
    }
  }
}

export function orientOnSurface(tool, container, normal) {
  const type = classifySurface(normal);
  container.rotation.set(0, 0, 0);
  
  // Restore scale (flip state) for surface placement, except if explicitly handled below
  container.scale.x = tool.flipX ? -1 : 1;
  container.scale.z = tool.flipZ ? -1 : 1;
  
  if (type === 'wall') {
    container.rotation.y = Math.atan2(normal.x, normal.z);
    
    // Use the asset size in Z for depth adjustment relative to the center.
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