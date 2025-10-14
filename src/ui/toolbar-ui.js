export class ToolbarUI {
    constructor(toolManager, mapManager, historyManager) {
        this.toolManager = toolManager;
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        this.container = document.getElementById('toolbar');
        this.leftPanelVisible = true;
        this.rightPanelVisible = true;
        // Defer actual rendering and wiring to smaller modules
        this.init();
    }

    async init() {
        const [{ renderToolbarMarkup, attachToolbarListeners }, { addToolbarStyles }, { setupToolbarEvents }] = await Promise.all([
            import('./toolbar/buttons.js'),
            import('./toolbar/styles.js'),
            import('./toolbar/events.js')
        ]);

        addToolbarStyles();
        this.container.innerHTML = renderToolbarMarkup();
        this.attachEventHandlers = attachToolbarListeners.bind(this);
        // Wire common events and pass helpers
        setupToolbarEvents({
            ui: this,
            toolManager: this.toolManager,
            mapManager: this.mapManager,
            historyManager: this.historyManager
        });
        // Attach per-button listeners that depend on instance state
        this.attachEventHandlers();
        this.updateHistoryButtons();
    }

    // The rendering, styling and DOM wiring are delegated to the smaller toolbar modules
    // to avoid duplicated logic; these methods are intentionally lightweight.
    setupEventListeners() {
        // event wiring is handled by src/ui/toolbar/events.js via setupToolbarEvents()
    }

    render() {
        // Re-run async init to re-render toolbar if needed
        this.init();
    }

    addStyles() {
        // Styling delegated to src/ui/toolbar/styles.js (addToolbarStyles)
    }

    attachEventListeners() {
        // DOM listeners delegated to src/ui/toolbar/buttons.js (attachToolbarListeners)
    }

    setPanelVisibility(side, visible) {
        if (side === 'left') {
            this.leftPanelVisible = visible;
        } else if (side === 'right') {
            this.rightPanelVisible = visible;
        }

        const mainContainer = document.getElementById('main-container');
        const btn = document.getElementById(`toggle-${side}-panel`);
        const sidebarEl = document.getElementById(side === 'left' ? 'sidebar-left' : 'sidebar-right');

        if (visible) {
            mainContainer.classList.remove(`${side}-panel-hidden`);
        } else {
            mainContainer.classList.add(`${side}-panel-hidden`);
        }

        btn.classList.toggle('active', visible);

        // Trigger resize now and after the transition completes
        window.app?.sceneManager?.handleResize();
        const onEnd = () => {
            sidebarEl.removeEventListener('transitionend', onEnd);
            window.app?.sceneManager?.handleResize();
        };
        sidebarEl.addEventListener('transitionend', onEnd, { once: true });
    }

    toggleLeftPanel() {
        this.setPanelVisibility('left', !this.leftPanelVisible);
    }

    toggleRightPanel() {
        this.setPanelVisibility('right', !this.rightPanelVisible);
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) undoBtn.disabled = !this.historyManager.canUndo();
        if (redoBtn) redoBtn.disabled = !this.historyManager.canRedo();
    }

    handleNewMap() {
        const createNew = () => {
            this.mapManager.clear();
            this.historyManager.clear();
            this.mapManager.mapName = 'Untitled Map';
            window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
        };

        if (this.mapManager.isDirty) {
            window.dispatchEvent(new CustomEvent('openMapsHub'));
        } else {
            createNew();
        }
    }

    exportMap() {
        const xml = this.mapManager.exportXML();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.mapManager.mapName}.xml`;
        a.click();
        URL.revokeObjectURL(url);
    }
}