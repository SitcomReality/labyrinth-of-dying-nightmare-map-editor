export class AssetPanelState {
    constructor() {
        this.collapsedCategories = this._load('collapsedCategories', []);
        this.favorites = this._load('favoriteAssets', []);
        this.recentlyUsed = this._load('recentlyUsedAssets', []);
        this.sortMode = localStorage.getItem('assetSortMode') || 'alphabetical';
        this.viewMode = localStorage.getItem('assetViewMode') || 'list';
    }
    _load(key, def) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); } catch { return def; } }
    _save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

    setSortMode(mode) { this.sortMode = mode; localStorage.setItem('assetSortMode', mode); }
    setViewMode(mode) { this.viewMode = mode; localStorage.setItem('assetViewMode', mode); }
    toggleCollapsed(category) {
        const i = this.collapsedCategories.indexOf(category);
        if (i >= 0) this.collapsedCategories.splice(i, 1); else this.collapsedCategories.push(category);
        this._save('collapsedCategories', this.collapsedCategories);
    }
    isCollapsed(category) { return this.collapsedCategories.includes(category); }

    toggleFavorite(asset) {
        const i = this.favorites.indexOf(asset);
        if (i >= 0) this.favorites.splice(i, 1); else this.favorites.push(asset);
        this._save('favoriteAssets', this.favorites);
    }
    addRecentlyUsed(asset) {
        this.recentlyUsed = this.recentlyUsed.filter(a => a !== asset);
        this.recentlyUsed.unshift(asset);
        this.recentlyUsed = this.recentlyUsed.slice(0, 10);
        this._save('recentlyUsedAssets', this.recentlyUsed);
    }
}