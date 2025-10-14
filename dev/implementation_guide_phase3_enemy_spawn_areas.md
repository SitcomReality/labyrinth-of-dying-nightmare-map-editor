# Phase 3: Enemy Spawn Areas and Componentization

This document outlines how to define “enemy areas” in the editor so the generator can decide to use them at runtime.

## Goals
- Enable authors to mark areas as potential enemy spawn regions.
- Associate Components with those areas (e.g., difficulty hints, group sizes, tags).
- Keep map generator as the authority to select and populate enemies per level based on available areas and difficulty scaling.

## Editor Changes (files to update/create)

1) Enemy Area Shape Object
- Create: src/enemies/enemy-area-object.js
  - Wraps a transparent box/plane volume with editor-only sprite/handles, not rendered in game.
  - Config: { type:'enemy_area', areaType:'floor', bounds:{ width, depth }, tags:['spawn','grouped'], difficultyWeight:number, capacityHint:number }.
- Create: src/enemies/enemy-area-assets.js
  - Register “Enemy Area” as a special asset (under Special Assets / NPCs or a new "Gameplay" category).
- Create: src/enemies/enemy-area-controller.js
  - Manages add/remove/update; toggles visibility in editor mode.

2) Asset Panel Integration
- Update: src/assets/asset-manager.js
  - Add enemy area asset type and category (e.g., “Special Assets / Gameplay”).
- Update: src/ui/asset-panel/render-categories.js
  - Display the new asset category like other special assets.

3) Properties UI
- Create: src/ui/properties/enemy-area-properties-ui.js
  - Basic fields for bounds, difficultyWeight, capacityHint, tags.
  - Attach to PropertiesPanelUI when selecting enemy area.

4) Placement Tool Support
- Update: src/tools/placement-tool.js and src/tools/placement/positioning.js
  - Treat enemy areas as map pieces for grid alignment; allow rectangle sizing post-placement via properties rather than dynamic drag-resize (keep initial drop simple).

5) Serialization
- Update: src/map/serialize-map-v2.js
  - If object.serialize() returns type:'enemy_area' with config, include in defs/instances.
- Update: src/map/deserialize-map-v2.js
  - Restore enemy area objects from serialized data.

## Generator Contract (for main game)
- Enemy areas define potential spawn volumes only.
- Generator decides if/which to use per level: e.g., pick N areas based on desired enemy count and difficultyWeight.
- Areas can be ignored without breaking the map; they carry no baked spawns.

## Testing Checklist
- Place enemy area in a room; set tags/difficulty hints; serialize/deserialize preserves data.
- Multiple areas across map; generator preview mock validates selection logic (out-of-scope for editor, but confirm schema).
- Ensure enemy areas are editor-only visuals and do not render in the game scene.

