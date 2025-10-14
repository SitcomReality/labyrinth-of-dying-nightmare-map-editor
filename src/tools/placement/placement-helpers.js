// lightweight helper utilities shared by placement modules
export function isMapPiece(assetName) {
    if (!assetName) return false;
    const lower = assetName.toLowerCase();
    return lower.startsWith('floor') || lower.startsWith('wall') || 
           lower.startsWith('stairs') || lower.startsWith('ceiling') || 
           lower.startsWith('barrier') || lower.startsWith('column') || lower.startsWith('pillar');
}

