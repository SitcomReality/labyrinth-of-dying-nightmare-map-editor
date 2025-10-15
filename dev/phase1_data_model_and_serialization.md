# Phase 1: Data Model and Serialization Update

This document outlines the first phase of updating the map editor to support the new V3 map conventions. This phase focuses on foundational changes to the in-memory data models and the serialization process for saving and loading maps.

### Step 1: Update Core Data Models

The first step is to ensure our in-memory representation of the map and its objects can accommodate the new V3 features.

1.  **Introduce Map Theme**:
    -   In `/src/map/map-manager.js`, the `MapManager` class already has a `metadata` object. This object will be the home for the new `theme` property. No code change is needed to add the property, but we must ensure it's managed correctly.
    -   The `theme` will be set in a later phase (via the UI), but the serialization logic in Step 3 must be updated to save and load it.

2.  **Formalize Gameplay Components**:
    -   The V3 convention introduces formal `Collision` and `Navigable` components. The existing `ComponentsEditor` in `/src/ui/components/components-editor.js` already provides a UI for these.
    -   The key task for this phase is to establish the logic for *automatically assigning* these components when objects are placed.
    -   In `/src/tools/placement/actions.js`, locate the `placeObject` function. It already contains logic to add a `Navigation` component to floor pieces. This logic should be expanded.
    -   Add a rule to assign a default `Collision` component to any construction or decoration object that is *not* a floor piece (e.g., walls, furniture, pillars). The default can be simple, like `components.Collision = { shape: 'box' };`.

### Step 2: Update Serialization Logic

This step implements the file efficiency optimizations and ensures the new data models are correctly written to and read from map files. These changes will be made primarily in `/src/map/serialize-map-v2.js` and `/src/map/deserialize-map-v2.js`.

1.  **Reduce Floating Point Precision**:
    -   Open `/src/map/serialize-utils.js`.
    -   Change the `PRECISION` constant from `4` to `2`. This will round all position and rotation values to two decimal places, significantly reducing file size as per the V3 convention.

2.  **Implement Conditional Object IDs**:
    -   The V3 format specifies that object IDs should only be saved if they are referenced by another system (like a trigger). For now, we can simplify this to mean that static, decorative objects without special components can omit their ID.
    -   In `/src/map/serialize-map-v2.js`, modify the `serializeMap` function. In the loop that creates the `inst` (instance) object, the `id: obj.id` line should be made conditional. For example, only include the `id` if the object has a non-empty `components` object or a specific `obId`.

3.  **Serialize Map-Level Metadata**:
    -   In `/src/map/serialize-map-v2.js`, ensure the `theme` from `mapManager.metadata` is saved in the root metadata object of the serialized file.
    -   In `/src/map/deserialize-map-v2.js`, update the `deserializeMap` function to read this `theme` property from the file and set it on the `mapManager.metadata` object when a map is loaded.

By the end of this phase, the map editor will save files that are smaller and compliant with the foundational data structure of the V3 map format, paving the way for the functional and UI changes in subsequent phases.

