# Implementation Roadmap

This roadmap ties all phases together and defines suggested order of execution with checkpoints.

1) Phase 1: Connectors and Themes
- Implement connector plane geometry, width metadata, placement constraints.
- Theme UI and theme registry; surface recommended assets.
- Update serialization for connector data.

2) Phase 2: Collision/Navigability and File Efficiency
- Replace Walkable with Navigable; default floor Navigable.
- Auto Collision tagging on qualifying categories.
- Round to 2 decimals and normalize ground-level positions.
- Omit instance ids unless addressable.

3) Phase 3: Enemy Areas
- Implement enemy area object/controller/UI.
- Integrate with serialize/deserialize.
- Define generator contract and mock tests.

4) Main Game Refactor
- Loader: v2 format support; special types; id omission handling.
- Generator: connector matching, theme selection bias, enemy area selection.
- Movement/pathing: collision-driven traversal with Navigation hints.

Checkpoints:
- Each phase complete with tests (placement, save/load, UI).
- Backwards compatibility layer verified for legacy maps.
- Main game integration tests confirm runtime uses new conventions end-to-end.

