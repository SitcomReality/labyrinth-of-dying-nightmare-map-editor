export class MapMetadataUI {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.container = null;
        this.render();
        this.attachEvents();
    }

    render() {
        const sidebar = document.getElementById('sidebar-right');
        if (!sidebar) return;
        this.container = document.createElement('div');
        this.container.className = 'panel-section';
        const t = this.mapManager.metadata || { typeTags: [], themeTags: [], gameplayTags: [] };
        this.container.innerHTML = `
            <div class="panel-section-header" id="map-meta-header">
                <h3>Map Metadata</h3>
                <span class="panel-section-toggle">▼</span>
            </div>
            <div class="panel-section-content">
                <div class="property-group">
                    <label>Type Tags (comma-separated)</label>
                    <input type="text" id="meta-type-tags" placeholder="corridor, room, junction, dead end, treasure room, boss arena" value="${(t.typeTags||[]).join(', ')}"/>
                </div>
                <div class="property-group">
                    <label>Theme Tags (comma-separated)</label>
                    <input type="text" id="meta-theme-tags" placeholder="gothic, crypt, forest, volcanic, icy, arcane" value="${(t.themeTags||[]).join(', ')}"/>
                </div>
                <div class="property-group">
                    <label>Gameplay Tags (comma-separated)</label>
                    <input type="text" id="meta-gameplay-tags" placeholder="traps, puzzles, environmental hazards, timed, stealth" value="${(t.gameplayTags||[]).join(', ')}"/>
                </div>
            </div>
        `;
        sidebar.appendChild(this.container);
    }

    attachEvents() {
        const header = this.container.querySelector('#map-meta-header');
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
        });

        const apply = () => {
            const typeTags = this._parse('#meta-type-tags');
            const themeTags = this._parse('#meta-theme-tags');
            const gameplayTags = this._parse('#meta-gameplay-tags');
            this.mapManager.metadata = { typeTags, themeTags, gameplayTags };
            this.mapManager.isDirty = true;
            this.mapManager.autoSave();
        };

        ['#meta-type-tags', '#meta-theme-tags', '#meta-gameplay-tags'].forEach(sel => {
            const el = this.container.querySelector(sel);
            if (el) {
                el.addEventListener('change', apply);
                el.addEventListener('blur', apply);
            }
        });

        window.addEventListener('mapLoaded', () => this.refresh());
    }

    _parse(sel) {
        const val = this.container.querySelector(sel)?.value || '';
        return val.split(',').map(s => s.trim()).filter(Boolean);
    }

    refresh() {
        const t = this.mapManager.metadata || { typeTags: [], themeTags: [], gameplayTags: [] };
        const setVal = (sel, arr) => {
            const el = this.container.querySelector(sel);
            if (el) el.value = (arr||[]).join(', ');
        };
        setVal('#meta-type-tags', t.typeTags);
        setVal('#meta-theme-tags', t.themeTags);
        setVal('#meta-gameplay-tags', t.gameplayTags);
    }
}