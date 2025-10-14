# Phase 1: Map Piece Connectors and Theme Surfacing

This document outlines step-by-step changes to introduce structured Connectors (portal planes with explicit widths) and a theme-driven asset surfacing experience in the editor.

## Goals
- Replace point-like "Connection Point" with proper portal connectors aligned to gridlines, rendered as thin vertical planes/boxes.
- Add explicit width metadata (1–4 panels: 4, 8, 12, 16 grid units; using 4-unit door/panel width base) so connectors only match/connect with identical widths.
- Introduce "Theme" selection when creating a new map; surface relevant construction assets at the top of the Asset Panel per chosen theme.

## Editor Changes (files to update/create)

1) Connector Model and Config
- Update: src/connectors/connector-assets.js
  - Add connector variants with widths: 1-panel (4 units), 2-panel (8 units), 3-panel (12 units), 4-panel (16 units).
  - Fields: { type:'connector', widthPanels:1..4, widthUnits: 4*panels, snapToGridline:true }.
- Update: src/connectors/connector-object.js
  - Replace current arrow extrude with a vertical plane/box (height ~3 units, thickness ~0.1–0.25).
  - Align to grid (XZ alignment). The plane stands along a gridline (like a wall).
  - Store width in config; scale X to widthUnits.
  - Provide methods: setWidthPanels(p), setWidthUnits(u), setDirection(d). Validate rotation to face along cardinal axes.
  - Ensure sprite remains useful in editor (small overlay icon optional; keep minimal).
- Update: src/connectors/connector-controller.js
  - No major changes; ensure add/remove still works.

2) Placement Tool Support
- Update: src/tools/connector-tool.js
  - On placement, snap the connector to the nearest gridline and clamp rotation to 0, ±π/2, π.
  - Disallow rotating connector via drag; rotation should cycle cardinal directions by key (e.g. Q/E), or keep current “no-rotation” behavior but align via snap.
- Update: src/tools/placement/positioning.js
  - When isConnectorAsset, orient and lock to gridline; if surface snap active, allow mounting on walls but retain vertical orientation.
- Update: src/tools/placement/core.js
  - When isConnectorAsset, set isMapPieceAsset=true for quadrant rules and corner offset alignment, but allow placement on any quadrant if needed (to be confirmed later).

3) Map Serialization for Connector Widths
- Update: src/map/serialize-map-v2.js
  - Ensure connector instance records widthPanels/widthUnits within `inst.data` if it differs from `def.data`.
- Update: src/map/deserialize-map-v2.js
  - Read width fields from instance data and apply to ConnectorObject.

4) Theme Selection and Surfacing
- Create: src/ui/themes/theme-registry.js
  - Export THEMES: array of theme objects { id, name, tags, assetBoost: [assetBasenames or categories] }.
- Create: src/ui/themes/theme-ui.js
  - A small modal UI shown on New Map: pick theme; store in mapManager.metadata.themeTags.
- Update: src/ui/maps-hub/index.js & render.js
  - On newMap(), open Theme UI; persist selection in mapManager.metadata.
- Update: src/assets/asset-manager.js
  - Add method `getThemeBoostedAssets(theme)` that returns a list of assets prioritized in UI.
- Update: src/ui/asset-panel/render-categories.js
  - If mapManager.metadata.themeTags present, render boosted assets first (“Recommended for Theme”) with pinned section semantics above others.

## Data Model Additions
- Connector data fields: widthPanels (1..4), widthUnits (integer), snapToGridline (bool).
- Map metadata: themeTags (array of strings), maintained in mapManager.metadata.

## UX Behavior
- Connectors look like transparent walls; thin but visible, placed exactly on gridlines.
- Editor enforces connectors connect by equal width (in future pathing/generation logic); for now, record the width and show a subtle tooltip on mismatch during manual alignment.
- On “New Map”, user picks a theme; recommended assets appear pinned at top of Asset Panel.

## Testing Checklist
- Place 1–4 panel connectors; verify width scales along X and aligns to gridlines.
- Save/load maps; width preserved via serialize/deserialize v2.
- Theme selection persists across sessions; asset panel boosts relevant construction pieces.
- No regressions for legacy “Connection Point” if kept as a fallback (optional).

