# Connection Point System - TODO

This document outlines the remaining work required to complete the Connection Point System for the Modular Map Editor. The initial implementation provides the basic framework for creating, placing, and serializing connection point objects. The following features are needed to make the system fully functional and user-friendly.

## 1. Enhanced Editing and Manipulation

-   **Move Tool Integration:** The "Select" tool should be enhanced or a "Move" tool created to allow users to select and drag existing connection points to new locations on the grid.
-   **Rotation:** Users should be able to rotate connection points. The current properties panel allows changing the direction via a dropdown, but a visual rotation gizmo similar to the one for models would be more intuitive.
-   **Snapping:** Connection points should snap intelligently:
    -   To the main grid.
    -   To the edges of the defined map piece boundaries.
    -   To the center of grid cells.

## 2. Improved Visualization

-   **Directional Gizmo:** The current arrow gizmo is a good start. It should be improved to more clearly indicate the "outward" direction of the connection. Color-coding or different shapes for different connection types could also be added.
-   **In-World Properties:** Display key properties (like connection type) as text above the gizmo in the editor view for at-a-glance information.
-   **Boundary Visualization:** Implement the "Boundary and Dimension Standards" system. This is crucial for connection points, as they are only meaningful in relation to the boundaries of a map piece.

## 3. Map Piece Context

-   **Piece Definition:** The concept of a "map piece" needs to be formally defined. This might involve a special "boundary" object or a UI panel where the dimensions of the current piece are set.
-   **Parenting:** Connection points should be logically parented to a map piece. When the piece is moved or rotated, all its connection points should move with it. This could be achieved through the grouping feature mentioned in the requirements.
-   **Validation:** Implement a validation system that checks if connection points are correctly placed:
    -   Are they on the boundary of the map piece?
    -   Are they facing outwards?
    -   Do they align with the grid?

## 4. UI/UX Enhancements

-   **Connection Type Presets:** The "Connection Type" property is currently a free-text field. This should be a dropdown with a predefined, configurable list of types (e.g., `corridor`, `doorway`, `stairs_up`, `stairs_down`).
-   **Automatic Placement:** A tool or mode could be created to automatically place connection points at any open-ended wall or floor tile at the boundary of the piece.
-   **Test Connection Mode:** A key feature would be a mode to select two map pieces from the library and see how they connect, highlighting any misalignments in their connection points.

## 5. Export and Game Integration

-   **Serialization:** The export format (currently JSON, eventually XML or another format) must include a dedicated section for connection points, formatted in a way that the game's level generator can easily parse. This should include position, direction, and type for each connection.
-   **Piece Metadata:** The main metadata for the map piece should include a count of its connection points and a summary of their types.

