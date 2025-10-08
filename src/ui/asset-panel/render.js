import { AssetThumbnailGenerator } from '../asset-thumbnail-generator.js';
import { renderHeader } from './render-header.js';
import { addAssetPanelStyles } from './styles.js';
import { renderAllCategories, filterAssetsInView } from './render-categories.js';
import { generateThumbnailsForContainer } from './render-thumbnails.js';

export class AssetPanelRenderer {
    constructor(container, assetManager, state) {
        this.container = container;
        this.assetManager = assetManager;
        this.state = state;
        this.thumbnailGenerator = new AssetThumbnailGenerator(window.app?.sceneManager);
    }
    render() {
        addAssetPanelStyles();
        this.container.innerHTML = renderHeader(this.state);
        this.renderCategories();
    }
    renderCategories() {
        // Delegate all category rendering logic
        renderAllCategories(this);
    }
    async generateThumbnails() {
        // Delegate thumbnail generation logic, using the local generator instance
        // Generate for both pinned and main container
        await generateThumbnailsForContainer(this.container.querySelector('#asset-panel-pinned'), this.assetManager, this.thumbnailGenerator);
        await generateThumbnailsForContainer(this.container.querySelector('#asset-categories'), this.assetManager, this.thumbnailGenerator);
    }
    filterAssets(query) {
        // Delegate filter logic
        filterAssetsInView(this.container, query);
    }
}