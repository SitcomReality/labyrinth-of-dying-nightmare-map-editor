import { createGhost, disposeGhost } from './ghost-factory.js';
import * as THREE from 'three';

// Add a helper function to check if an asset is a map piece
function isMapPiece(assetName) {
    const lower = assetName.toLowerCase();
    // Broad categories that represent structural dungeon pieces
    return lower.startsWith('floor') || lower.startsWith('wall') || 
           lower.startsWith('stairs') || lower.startsWith('ceiling') || 
           lower.startsWith('barrier') || lower.startsWith('column') || lower.startsWith('pillar');
}

export { setAsset, clearGhost } from './placement/core.js';
export { placeObject, cancel } from './placement/actions.js';