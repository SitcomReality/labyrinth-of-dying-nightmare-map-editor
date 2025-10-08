export class AssetPanelEvents {
    constructor(renderer, toolManager, state) {
        this.r = renderer;
        this.toolManager = toolManager;
        this.state = state;
    }
    attach() {
        const searchEl = document.getElementById('asset-search');
        window.app?.inputFocusManager?.registerSearchInput?.(searchEl);
        searchEl.addEventListener('input', (e)=> this.r.filterAssets(e.target.value));

        const sortEl = document.getElementById('asset-sort-mode');
        sortEl.addEventListener('change', (e)=> {
            this.state.setSortMode(e.target.value);
            this.r.renderCategories();
        });

        const viewToggle = document.getElementById('asset-view-toggle');
        viewToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.view-mode-btn');
            if (!btn) return;
            const mode = btn.dataset.mode;
            this.state.setViewMode(mode);
            viewToggle.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.r.renderCategories();
        });

        this.r.container.addEventListener('click', (e) => {
            const head = e.target.closest('.category-header');
            if (head) { this._toggleCategory(head); return; }
            const fav = e.target.closest('.favorite-btn');
            if (fav) { e.stopPropagation(); this._toggleFavorite(fav.dataset.asset); this.r.renderCategories(); return; }
            const item = e.target.closest('.asset-item');
            if (item) this._selectAsset(item.dataset.asset, searchEl, item);
        });
    }
    _toggleCategory(header) {
        const category = header.dataset.category;
        const items = header.nextElementSibling;
        const toggle = header.querySelector('.category-toggle');
        this.state.toggleCollapsed(category);
        const collapsed = this.state.isCollapsed(category);
        items.classList.toggle('collapsed', collapsed);
        toggle.textContent = collapsed ? '▶' : '▼';
    }
    _toggleFavorite(asset) {
        this.state.toggleFavorite(asset);
    }
    _selectAsset(assetName, searchEl, itemEl) {
        searchEl.blur();
        const model = this.r.assetManager.cloneAsset(assetName);
        if (!model) return;
        this.state.addRecentlyUsed(assetName);
        this.toolManager.setTool('placement');
        this.toolManager.tools.placement.setAsset(assetName, model);
        document.querySelectorAll('.asset-item.active').forEach(i => i.classList.remove('active'));
        itemEl.classList.add('active');
    }
}