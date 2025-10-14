import * as THREE from 'three';
import { LightObject } from '../lights/light-object.js';
import { TextObject } from '../text/text-object.js';
import { ShapeObject } from '../shapes/shape-object.js';
import { ConnectorObject } from '../connectors/connector-object.js';
import { NPCObject } from '../npc/npc-object.js';
import { serializeMap as serializeMapCore, deserializeMap as deserializeMapCore } from './serialize-core.js';

// Thin wrapper so there's a single authoritative implementation in serialize-core.js
export const serializeMap = (mapManager) => serializeMapCore(mapManager);
export const deserializeMap = async (data, mapManager, assetManager) => {
    return await deserializeMapCore(data, mapManager, assetManager);
};