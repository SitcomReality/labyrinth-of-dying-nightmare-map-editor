export class AssetPanelUI {
    constructor(assetManager, toolManager) {
        this.assetManager = assetManager;
        this.toolManager = toolManager;
        this.container = document.getElementById('sidebar-left');
        // Defer async module loading to init()
        this.state = null;
        this.renderer = null;
        this.events = null;
        this.init();
    }

    async init() {
        const { AssetPanelState } = await import('./state.js');
        const { AssetPanelRenderer } = await import('./render.js');
        const { AssetPanelEvents } = await import('./events.js');

        this.state = new AssetPanelState();
        this.renderer = new AssetPanelRenderer(this.container, this.assetManager, this.state);
        this.events = new AssetPanelEvents(this.renderer, this.toolManager, this.state);

        this.renderer.render();
        this.events.attach();
        this.renderer.generateThumbnails();
    }
}