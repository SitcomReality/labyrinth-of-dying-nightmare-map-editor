export function renderToolbarMarkup() {
    return `
        <div class=\"toolbar-content\">
            <div class=\"tool-group\">
                <button class=\"tool-btn active\" id=\"toggle-left-panel\" title=\"Toggle Asset Panel\">
                    <span>◧ Assets</span>
                </button>
                <button class=\"tool-btn active\" id=\"toggle-right-panel\" title=\"Toggle Object List\">
                    <span>◨ Objects</span>
                </button>
            </div>

            <div class=\"tool-group\">
                <button class=\"tool-btn\" data-tool=\"none\" title=\"None\">
                    <span>None</span>
                </button>
                <button class=\"tool-btn active\" data-tool=\"select\" title=\"Select (V)\">
                    <span>Select</span>
                </button>
                <button class=\"tool-btn\" data-tool=\"pickup\" title=\"Pickup (G)\">
                    <span>Pickup</span>
                </button>
                <button class=\"tool-btn\" data-tool=\"copy\" title=\"Copy (Shift+G)\">
                    <span>Copy</span>
                </button>
                <button class=\"tool-btn\" data-tool=\"delete\" title=\"Delete (X)\">
                    <span>Delete</span>
                </button>
                <button class=\"tool-btn\" data-tool=\"rotate\" title=\"Rotate (R)\">
                    <span>Rotate</span>
                </button>
                <button class=\"tool-btn\" data-tool=\"connector\" title=\"Connection Point\">
                    <span>Connector</span>
                </button>
            </div>
            
            <div class=\"tool-group\">
                <button class=\"tool-btn\" id=\"snap-grid\" title=\"Snap to Grid\">
                    <span>Snap</span>
                </button>
            </div>
            
            <div class=\"tool-group\">
                <button class=\"tool-btn\" id=\"undo-btn\" title=\"Undo (Ctrl+Z)\">
                    <span>Undo</span>
                </button>
                <button class=\"tool-btn\" id=\"redo-btn\" title=\"Redo (Ctrl+Shift+Z)\">
                    <span>Redo</span>
                </button>
            </div>

            <div class=\"tool-group\">
                <button class=\"tool-btn\" id=\"maps-hub-btn\" title=\"Maps Hub — Save / Load / Import / Export / Share\">
                    <span>🗂️ Maps Hub</span>
                </button>
            </div>
        </div>
    `;
}

export function attachToolbarListeners() {
    this.container.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            this.container.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.toolManager.setTool(btn.dataset.tool);
        });
    });
    
    document.getElementById('toggle-left-panel').addEventListener('click', () => this.toggleLeftPanel());
    document.getElementById('toggle-right-panel').addEventListener('click', () => this.toggleRightPanel());
    
    document.getElementById('snap-grid').addEventListener('click', (e) => {
        e.currentTarget.classList.toggle('active');
        this.toolManager.setSnapToGrid(e.currentTarget.classList.contains('active'));
    });
    
    document.getElementById('maps-hub-btn').addEventListener('click', () => {
        if (window.app?.uiManager?.mapsHub?.show) {
            try { window.app.uiManager.mapsHub.show(); return; } catch (e) { }
        }
        window.dispatchEvent(new CustomEvent('openMapsHub'));
    });
    
    document.getElementById('undo-btn').addEventListener('click', () => this.historyManager.undo());
    document.getElementById('redo-btn').addEventListener('click', () => this.historyManager.redo());
}