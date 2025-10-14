# New Map Format and Editor Conventions Summary

This document summarizes the conventions to be adopted across the editor and serialization.

## Connectors
- Represent portals on gridlines with thin, vertical planes/boxes (editor-visible, akin to walls).
- Explicit width defined by panels (4-unit panels): 1–4 panels wide.
- Only equal-width connectors are compatible for joining; metadata recorded in `def.data` or `inst.data`.

## Themes
- New map creation requires picking a theme; stored in map metadata (themeTags).
- Asset panel surfaces “Recommended for Theme” assets (boosted list) above other categories.

## Collision and Navigability
- Walkable is removed; only Navigation (isNavigable) indicates pathing viability.
- Floors: auto Navigable by default.
- Movement is determined by Collision; Construction/Furniture/Containers default to Collision on placement.
- Component Editor reflects default Collision and Navigation.

## Serialization Efficiency
- Positions and rotations rounded to 2 decimals.
- Ground-level walls normalized to y=0 with small offset only when necessary.
- Omit instance `id` unless object needs addressing (triggers, obId present, or explicit hasAddressable).

## Enemy Areas
- Editor defines areas eligible for enemy spawns via dedicated objects/components.
- Generator decides usage per level; enemy areas are hints, not directives.

## Backwards Compatibility
- Legacy maps:
  - Translate Walkable to Navigation.
  - Inject default Collision for qualifying categories.
  - Normalize positions and rotations on next save/export.

