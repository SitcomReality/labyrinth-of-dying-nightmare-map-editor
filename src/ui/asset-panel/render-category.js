export function sortAssets(assets, state) {
  const mode = state.sortMode;
  if (mode === 'alphabetical') return [...assets].sort((a,b)=>a.localeCompare(b));
  if (mode === 'type') return [...assets].sort((a,b)=>getAssetType(a).localeCompare(getAssetType(b)) || a.localeCompare(b));
  if (mode === 'usage') {
    return [...assets].sort((a,b)=>{
      const ia=state.recentlyUsed.indexOf(a), ib=state.recentlyUsed.indexOf(b);
      if (ia===-1 && ib===-1) return a.localeCompare(b);
      if (ia===-1) return 1; if (ib===-1) return -1; return ia-ib;
    });
  }
  return assets;
}

export function getAssetType(name) {
  const lower=name.toLowerCase();
  if (lower.includes('floor')) return 'floor';
  if (lower.includes('wall')) return 'wall';
  if (lower.includes('stairs')) return 'stairs';
  if (lower.includes('light')) return 'light';
  return 'other';
}

export function createCategoryElement(category, assets, compact, state, assetManager, sortFn, fullCategoryName = category) {
  const isCollapsed = state.isCollapsed(fullCategoryName);
  const el = document.createElement('div');
  el.className='asset-category';
  const viewModeClass = state.viewMode === 'grid' ? 'asset-items-grid' : 'asset-items-list';
  el.innerHTML = `
      <div class="category-header" data-category="${fullCategoryName}">
          <span class="category-toggle">${isCollapsed?'▶':'▼'}</span>
          <span class="category-name">${category}</span>
          <span class="category-count">(${assets.length})</span>
      </div>
      <div class="category-items ${viewModeClass} ${isCollapsed?'collapsed':''}">
          ${assets.map(a=>`
            <div class="asset-item" data-asset="${a}">
              <div class="asset-thumbnail loading" data-asset-name="${a}">
                ${compact ? '' : `<button class="favorite-btn ${state.favorites.includes(a)?'active':''}" data-asset="${a}" title="Favorite">⭐</button>`}
              </div>
              <div class="asset-info">
                <span class="asset-name">${a}</span>
              </div>
            </div>
          `).join('')}
      </div>
  `;
  // collapse/expand is handled centrally via event delegation in AssetPanelEvents;
  // remove per-element click handlers to avoid double-toggling of state.
  return el;
}