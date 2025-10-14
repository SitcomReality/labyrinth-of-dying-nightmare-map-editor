export function renderHeader(state) {
  return `
    <div class="panel-header asset-panel-header">
        <h2>Assets</h2>
        <div class="asset-panel-controls">
            <select id="asset-sort-mode" class="asset-sort-select">
                <option value="alphabetical" ${state.sortMode==='alphabetical'?'selected':''}>A-Z</option>
                <option value="type" ${state.sortMode==='type'?'selected':''}>By Type</option>
                <option value="usage" ${state.sortMode==='usage'?'selected':''}>Most Used</option>
            </select>
            <div id="asset-view-toggle" class="asset-view-toggle">
                <button class="view-mode-btn ${state.viewMode === 'list' ? 'active' : ''}" data-mode="list" title="List View">☰</button>
                <button class="view-mode-btn ${state.viewMode === 'grid' ? 'active' : ''}" data-mode="grid" title="Grid View">⊞</button>
            </div>
            <input type="text" id="asset-search" placeholder="Search assets..." />
        </div>
    </div>
    <div id="asset-panel-pinned"></div>
    <div class="asset-categories" id="asset-categories"></div>
  `;
}

