# Main Game Refactor Guide: Adopting New Editor Map Conventions

This document guides changes to the main game runtime and map generator to support the updated editor conventions and serialized format.

## Overview
The editor now emits v2 map data with explicit connector widths, a theme in metadata, navigability-only pathing, collision-driven movement, and optional enemy areas. The game must consume these fields and adjust systems accordingly.

## Required Runtime Changes

1) Map Loader
- Update the loader to parse v2 format:
  - Apply environment values (ambient/directional lights, fog, background).
  - Build scene graph from defs/instances; handle special types (light, text, shape, connector, npc, enemy_area).
  - Honor flipX/flipZ; treat omitted ids as non-addressable; generate runtime ids where needed for debug only.
  - Normalize ground placement; expect positions rounded to 2 decimals.

2) Theme Awareness
- Read `metadata.tags.themeTags` for level mood presets (lighting, music, ambience).
- Optional: filter or adjust spawn tables and room selection by theme tags.

3) Connectors and Topology
- Read connector width fields (widthPanels/widthUnits).
- When assembling/connecting map pieces, only join connectors of equal width.
- Direction remains cardinal; treat connectors visually as wall-like objects for portal tests.

4) Movement and Pathing
- Navigation replaces Walkable: use components.Navigation.isNavigable for path graph nodes.
- Movement availability is driven by Collision components:
  - Floors are Navigable; movement is allowed if collision bounds permit.
  - Objects marked Collision (Furniture, Containers, Construction) can be walkable surfaces depending on bounds and game logic (e.g., climbable, jumpable).
- Ensure physics/collision system references bounds from ComponentsEditor outputs; default to box shapes where unspecified.

5) Enemy Areas
- Read enemy_area instances:
  - Use difficultyWeight and capacityHint to decide per-level usage.
  - On level build, select a subset of areas; spawn group counts based on total desired enemies and capacity.
  - If no areas chosen, the room remains empty; enemy area is a hint, not a mandate.

6) Serialization/Export
- When saving checkpoints or runtime snapshots, do not reintroduce obsolete Walkable fields.
- Maintain rounding and id omission consistent with editor v2: only include ids for addressable/triggered objects.

## Generator Changes

1) Connector-based Piece Matching
- Add matching logic: connector.widthPanels equality gate; reject mismatches.
- Support junctions/corridors with varying widths; if piece end widths differ, ensure compatibility on each end separately.

2) Theme-Driven Piece Selection
- Use themeTags to bias piece selection (e.g., gothic walls/floors for gothic theme).
- Maintain fallback when theme assets are missing.

3) Enemy Spawn Selection
- Compute desired enemy count per level.
- Collect candidate enemy_area instances; select based on difficultyWeight and capacityHint.
- Distribute enemies among selected areas, respecting capacity and gameplay constraints.

4) Collision-Driven Navigation Graph
- Build nav graph from Navigable and Collision:
  - Navigable marks spaces eligible for path nodes.
  - Collision bounds carve/permit movement; floors typically allow movement unless overlapped by blocking collision.
- Consider platforms/props with Collision enabling traversable surfaces (e.g., crates, tables) as valid nodes when height thresholds allow.

## Testing and Validation
- Load v2 maps; verify connectors, themes, enemy areas.
- Ensure equal-width connector joining enforces topology correctness.
- Movement respects collision; Navigation-only tag used for pathing.
- Levels with enemy areas scale difficulty by generator decisions; empty rooms remain valid.

