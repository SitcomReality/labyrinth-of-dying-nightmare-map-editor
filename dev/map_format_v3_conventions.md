# Map Format v3 Conventions Guide

This document outlines the changes and new conventions for map files to be consumed by the main game project. The goal is to support more complex procedural generation, improve gameplay mechanics, and increase file efficiency.

## 1. Map-Level Metadata

The root of the map data object will contain a `metadata` object, which now includes a `theme` property.

- **`theme`**: A string identifier for the map's visual and asset theme (e.g., "gothic_crypt", "forest_ruins"). The game can use this to select appropriate music, lighting presets, or post-processing effects.

## 2. Component System: Collision and Navigation

The gameplay-related tagging system is being formalized into a component-based structure. The previous "Walkable" tag is deprecated.

- **`Collision` Component**: This component signifies that an object should be part of the physics world and block character movement. By default, any object that is not a floor piece should be considered for collision.
  - **Schema**: The component can be a simple boolean (`"Collision": true`) for default behavior or an object for more complex shapes: ` "Collision": { "shape": "box" }`. Supported shapes will include "box", "sphere", and "capsule". If not specified, the game should use the object's bounding box.

- **`Navigable` Component**: This component replaces the "Walkable" tag and is used exclusively for AI pathfinding. Player movement is governed by collision, not this component.
  - **Schema**: This is a simple boolean component: `"Navigable": true`. All floor pieces will have this by default. NPCs will generate their navigation mesh based on objects with this component.

## 3. Connectors

Connectors are being upgraded from simple points to defined portals with a specific width. This allows for more intelligent map generation where corridors and doorways must match in size.

- **Connector Object**: Connectors are a distinct object type.
- **`width` Property**: Each connector will have a `width` property, an integer from 1 to 4, representing the number of standard grid panels it occupies.
- **Connection Logic**: The map generator must only connect two connectors that have the same `width`.

## 4. Enemy Spawn Areas

Maps can now contain designated areas where enemies may spawn. The map generator retains control over *if* and *how many* enemies to spawn, but these areas define the *where*.

- **`EnemySpawnArea` Object**: These are defined within the map as separate objects, typically represented by a volume (like a box or cylinder).
- **Component Data**: Spawn areas can have their own components to provide hints to the generator, such as:
  - **`"Difficulty"`**: { "min": 1, "max": 5 }
  - **`"EnemyTypes"`**: ["goblin", "skeleton"]
  - **`"SpawnStrategy"`**: "cluster" | "patrol"

The game's map generator should parse these areas and use them as potential locations when populating a level with enemies according to its own difficulty curve and logic.

## 5. File Efficiency Optimizations

To reduce map file sizes and improve loading times, the following changes will be implemented:

- **Conditional Object IDs**: An object will only have an `id` field in the map file if it is referenced by another system, such as a `Trigger` component. For purely static, decorative objects, the `id` will be omitted. The game should be robust enough to handle objects with or without an ID.
- **Floating Point Precision**: All position and rotation values will be rounded to two decimal places. This significantly reduces file size without any perceptible loss of precision.
- **Position Normalization**: In-editor vertical offsets for placing objects (like walls slightly above the ground plane to prevent Z-fighting) will be normalized. The game should assume a standard vertical alignment for common pieces. For example, all ground-level walls should be treated as having a Y position of 0 unless explicitly different.