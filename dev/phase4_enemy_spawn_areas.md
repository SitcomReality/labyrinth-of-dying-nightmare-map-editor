# Phase 4: Enemy Spawn Areas

This phase covers the implementation of a new tool and object type for defining enemy spawn areas within the map editor.

### Step 1: Create the Spawn Area Object

1.  **Create `EnemySpawnAreaObject.js`**: Create a new file, similar to `ShapeObject.js`. This class will represent a spawn area.
    -   Its mesh should be a simple, transparent, colored volume (e.g., a semi-transparent red box or cylinder).
    -   It will have a `config` object that stores its properties, such as `shape` ("box", "cylinder"), `size`, etc.
    -   It should not be visible in the final game, so it does not need to be part of the main asset list, but it will be a special object type like Lights and Shapes.

2.  **Create a New Asset Definition**: Similar to `shape-assets.js`, create `enemy-spawn-area-assets.js` to define the "assets" for spawn areas (e.g., "Box Spawn Area", "Cylinder Spawn Area").

3.  **Integrate with Controllers**: Create an `EnemySpawnAreaController.js` and integrate it into `app.js`, just like the `ShapeController` and `LightController`. The `MapManager` and serialization process must also be updated to handle this new object type.

### Step 2: Create a Tool for Placing Spawn Areas

1.  **Create `SpawnAreaTool.js`**: This will be a new tool for creating and editing spawn areas. It could be based on the `PlacementTool`.
    -   Add a new button to the `ToolbarUI` to activate this tool.
    -   When active, the user should be able to select a shape (box or cylinder) from a small UI panel.
    -   The user should be able to click and drag on the map to define the size and position of the spawn area volume. The first click sets the center, and dragging outward sets the radius or dimensions.

### Step 3: Implement Properties Editing

1.  **Create `EnemySpawnAreaPropertiesUI.js`**: Create a new properties UI file in `/src/ui/properties/`.
    -   This UI should allow the user to edit the dimensions (width, depth, height, or radius) of the spawn area.
    -   Crucially, it must include the `ComponentsEditor` so that users can add components like `Difficulty` or `EnemyTypes` to the spawn area object itself. This is where the metadata for the map generator will be defined.

2.  **Update `PropertiesPanelUI`**: In `/src/ui/properties-panel-ui.js`, add a case in the `showProperties` switch to instantiate `EnemySpawnAreaPropertiesUI` when a spawn area object is selected.

### Step 4: Finalize Serialization

1.  **Update `serialize-map-v2.js`**: Ensure that `EnemySpawnAreaObject` instances are serialized correctly. They should be saved just like other special object types (Shapes, Lights), including their transform, config, and any components attached to them. This will make them available to the main game's map generator.

