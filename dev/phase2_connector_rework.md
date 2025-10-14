# Phase 2: Connector System Rework

This phase details the implementation of the new map connector system. The goal is to replace the current point-based connectors with configurable, width-based portals that are visually represented in the editor.

### Step 1: Redefine the Connector Asset and Object

1.  **Update `connector-assets.js`**: The definition in `/src/connectors/connector-assets.js` needs to be expanded.
    -   Add a `width` property, defaulting to 1.
    -   The `type` should remain `"connector"`.

2.  **Rework `ConnectorObject.js`**: The file `/src/connectors/connector-object.js` requires significant changes.
    -   The `createMesh` method should no longer create an arrow. Instead, it should generate a `THREE.BoxGeometry` or `THREE.PlaneGeometry` that represents the portal.
    -   The size of this geometry must be determined by the `config.width` property. A width of 1 could correspond to a 4-unit wide plane in the editor (assuming a grid panel is 4 units). The plane should be vertically oriented.
    -   The material should be transparent and brightly colored (e.g., yellow or green) to be easily visible.
    -   Update `setConfig` or create a new `setWidth` method to dynamically resize the mesh when the width changes.

### Step 2: Update the Connector Tool

The tool for placing connectors needs to be adapted for the new object type.

1.  **Modify `ConnectorTool.js`**: This tool, located at `/src/tools/connector-tool.js`, is a specialized `PlacementTool`.
    -   Currently, it places objects with a single click. We need to add a way for the user to specify the width of the connector they are placing.
    -   One approach is to add a small UI element that appears when the `ConnectorTool` is active, allowing the user to select a width from 1 to 4. This could be added to the `ToolbarUI` or a floating widget.
    -   When `setAsset` is called on the `PlacementTool` for a connector, it should be passed a default config that includes the currently selected width.

### Step 3: Update the Connector Properties UI

The properties panel needs to allow editing of the new connector properties.

1.  **Modify `connector-properties-ui.js`**: In `/src/ui/properties/connector-properties-ui.js`:
    -   Remove the "Direction" dropdown, as the connector's orientation will now be handled by standard object rotation. Re-add the standard `renderRotationInput`.
    -   Add a new input for `width`. This could be a number input or a dropdown select with options 1 through 4.
    -   When the width is changed in the UI, it must call the `setWidth` (or equivalent) method on the `ConnectorObject` to visually update the portal in the scene.

### Step 4: Adjust Placement and Snapping

The new connectors need to snap to grid lines correctly.

1.  **Review `positioning.js`**: In `/src/tools/placement/positioning.js`, ensure the snapping logic correctly handles the new connector shapes.
    -   Connectors should snap to the center of a grid line, not the center of a grid cell. This may require special case logic for the connector asset type.
    -   The rotation should snap to 90-degree increments to ensure they align with the grid. This can be enforced in the `PlacementTool` when the asset is a connector.

