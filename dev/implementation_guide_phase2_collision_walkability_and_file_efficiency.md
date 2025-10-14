# Phase 2: Collision/Walkability Conventions and Map File Size Efficiency

This document plans the refactor to use Navigable-only tags, collision-driven movement, and map serialization normalization.

## Goals
- Replace Walkable with Navigable (for pathing only).
- Floors automatically tagged Navigable; movement/walkable areas are defined entirely by collision components.
- Default collision tagging for Walls, Construction, Furniture, Containers on placement.
- Reduce map file size via:
  - Omitting object IDs unless needed for triggers/special addressing.
  - Normalize ground-level Y values for walls (remove .1508 oddities).
  - Round position and rotation to 2 decimal places.

## Editor Changes (files to update/create)

1) Navigable-only Component
- Update: src/map/map-actions.js
  - When assetName starts with floor_, set components.Navigation = { isNavigable: true }.
- Update: src/tools/placement/actions.js
  - On place: if category is Construction/Furniture/Container/Walls, automatically set components.Collision = { enabled:true, shape:'box', bounds:auto } (minimal default).
  - Remove Walkable usage; use only Navigation for pathing; Movement relies on Collision.

2) Component Editors and Properties Panels
- Update: src/ui/components/components-editor.js
  - Reflect new defaults: Collision and Navigation.
  - Consider adding a simple “Make Navigable” toggle at the map object level for quick overrides.

3) Serialization Normalization
- Update: src/map/serialize-utils.js
  - Set PRECISION = 2; adjust round() accordingly.
- Update: src/map/serialize-map-v2.js
  - Do not include id in `inst` unless `obj.hasAddressable=true` or `components.Trigger` exists or `obId` is present.
  - If y is close to 0 within epsilon (e.g. |y| < 0.01), emit 0 to avoid odd decimals; similarly normalize common wall offsets to the nearest sensible constant (e.g., 0 or standard base).
- Update: src/map/deserialize-map-v2.js
  - Robustly handle missing ids; generate runtime ids where needed for editor UI but do not persist unless addressable.

4) Placement Normalization
- Update: src/tools/placement/positioning.js
  - When placing walls at ground plane, normalize y to 0 before snapping; for surface snap results, apply small offset only to avoid z-fighting (keep 0.01 lift).

## Data Model Adjustments
- MapObject: add flag `hasAddressable` default false; set true when a trigger or custom component implies unique addressing.
- Floor assets: always include components.Navigation with isNavigable:true in either def or inst.

## Testing Checklist
- Place floors: Navigable shows in components; no Walkable anywhere.
- Non-floor Construction/Furniture/Containers default to Collision present.
- Export JSON and verify positions/rotations rounded to 2 decimals; ground-level walls normalized.
- IDs absent for normal objects; present only for triggers/addressable components.
- Import legacy maps: translator sets Navigable where Walkable used to be; collision defaults applied.

