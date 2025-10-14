# Phase 3: Gameplay Components and Themes

This phase focuses on implementing the user-facing features for the new collision/navigation components and the map theme system.

### Step 1: Implement Theme Selection on New Map Creation

1.  **Modify `MapsHubUI`**: The \"New\" map functionality, currently in `/src/ui/maps-hub/render.js`'s `newMap` function, needs to be intercepted.
    -   Instead of immediately clearing the map, it should first present a modal or dialog asking the user to select a theme.
    -   This dialog should be populated with a list of available themes. Initially, this can be a hardcoded list (e.g., \"Dungeon\", \"Crypt\", \"Caverns\").
    -   Once a theme is selected, the `mapManager.clear()` method should be called, and the new `mapManager.theme` property should be set to the selected theme.

### Step 2: Integrate Theme into the Asset Panel

The primary user benefit of themes is a more organized asset panel.

1.  **Create Theme-Asset Manifests**: The developer (the user of this guide) will need to create new files that define which assets belong to which theme. For example:
    -   `src/assets/themes/theme_dungeon.js` exporting `const ASSET_LIST = [\"wall\", \"floor_tile\", ...];`
    -   `src/assets/themes/theme_crypt.js` exporting `const ASSET_LIST = [\"wall_cracked\", \"coffin\", ...];`

2.  **Modify `AssetPanelUI`**: The logic for rendering categories in `/src/ui/asset-panel/render-categories.js` needs to be updated.
    -   When rendering, it should first get the current map's theme from `window.app.mapManager.theme`.
    -   It should then dynamically load the corresponding theme asset list.
    -   A new, temporary category named \"Theme Assets\" or similar should be rendered at the very top of the asset panel. This category will contain all the assets listed in the theme's manifest.
    -   The rest of the asset panel can render as usual, but you could optionally filter out the theme assets from their normal categories to avoid duplication.

### Step 3: Automate Component Assignment

This step ensures the new `Collision` and `Navigable` components are applied automatically during object placement, as defined in the new conventions.

1.  **Update `placement-logic.js` or `actions.js`**: In the `placeObject` function in `/src/tools/placement/actions.js`.
    -   The logic drafted in Phase 1 should be finalized here. When a new map object is created, check its asset type.
    -   If it's a floor piece, add the `Navigable` component.
    -   If it's a wall, furniture, container, or other construction piece, add the `Collision` component.
    -   This ensures that users do not have to manually add these common components for every piece they place.

2.  **Verify `ComponentsEditor`**: Double-check the UI in `/src/ui/components/components-editor.js` to ensure it correctly displays and allows editing of these new, automatically-assigned components. It should reflect the changes made in Phase 1.
