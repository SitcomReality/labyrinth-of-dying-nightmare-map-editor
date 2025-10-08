export async function createGhost(asset, sceneManager) {
  let isLight = false, isText = false, isShape = false, ghost = null;
  if (asset.type === 'light') {
    isLight = true;
    const { LightObject } = await import('../../lights/light-object.js');
    ghost = new LightObject(asset.config, asset.name);
    makeTransparent(ghost.container);
    sceneManager.scene.add(ghost.container);
  } else if (asset.type === 'text') {
    isText = true;
    const { TextObject } = await import('../../text/text-object.js');
    ghost = new TextObject(asset.config, asset.name);
    makeTransparent(ghost.container);
    sceneManager.scene.add(ghost.container);
  } else if (asset.type === 'shape') {
    isShape = true;
    const { ShapeObject } = await import('../../shapes/shape-object.js');
    ghost = new ShapeObject(asset.config, asset.name);
    makeTransparent(ghost.container);
    sceneManager.scene.add(ghost.container);
  } else {
    // If the provided asset is a scene object that may carry highlight-altered materials,
    // create the clone and restore original materials where available so the ghost does not keep highlight.
    let originalNodes = [];
    if (asset.traverse) {
      asset.traverse((n) => originalNodes.push(n));
    }

    ghost = asset.clone();

    // Map traversal order of cloned nodes to original nodes and, if an original has stored
    // originalMaterial (from BaseTool.highlightObject), restore that material on the clone.
    let idx = 0;
    ghost.traverse((node) => {
      const orig = originalNodes[idx++];
      if (orig && orig.userData && orig.userData.originalMaterial) {
        node.material = Array.isArray(orig.userData.originalMaterial)
          ? orig.userData.originalMaterial.map(m => (m && m.clone ? m.clone() : m))
          : (orig.userData.originalMaterial && orig.userData.originalMaterial.clone ? orig.userData.originalMaterial.clone() : orig.userData.originalMaterial);
      }
    });

    makeTransparent(ghost);
    sceneManager.scene.add(ghost);
  }
  return { ghost, isLight, isText, isShape };
}

export function disposeGhost(ghost, sceneManager, { isLight, isText, isShape }) {
  if (!ghost) return;
  if (isLight || isText || isShape) {
    sceneManager.scene.remove(ghost.container);
    ghost.dispose();
  } else {
    sceneManager.scene.remove(ghost);
  }
}

function makeTransparent(root) {
  root.traverse?.((node) => {
    const m = node.material;
    if (node.isMesh || node.isSprite) {
      if (Array.isArray(m)) {
        node.material = m.map((mat) => {
          const c = mat?.clone ? mat.clone() : mat;
          if (c) { c.transparent = true; c.opacity = 0.5; }
          return c;
        });
      } else if (m) {
        const c = m?.clone ? m.clone() : m;
        if (c) { c.transparent = true; c.opacity = 0.5; }
        node.material = c;
      }
    }
  });
}