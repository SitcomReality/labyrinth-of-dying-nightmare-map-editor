export function addAssetPanelStyles() {
    if (document.getElementById('asset-panel-inline-styles')) return;
    const style = document.createElement('style');
    style.id = 'asset-panel-inline-styles';
    style.textContent = `
        /* Main Header Styles */
        .asset-panel-header{position:sticky!important;top:0;z-index:10;background:#0f0f0f;display:flex;flex-direction:column;gap:8px; padding: 0 16px 8px 16px;}
        .asset-panel-header h2{font-size:16px;font-weight:500;margin:0; padding: 12px 0 0 0;}
        .asset-panel-controls { display: flex; gap: 8px; align-items: center; }
        .asset-sort-select{padding:6px 10px;background:#1a1a1a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;font-size:12px;cursor:pointer;}
        #asset-search{flex-grow: 1; width: 100%;padding:8px 12px;background:#1a1a1a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;font-size:13px;}
        
        .asset-view-toggle { display: flex; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 4px; }
        .view-mode-btn { background: none; border: none; color: #888; padding: 4px 8px; cursor: pointer; }
        .view-mode-btn.active { color: #fff; background: #4a9eff; }

        /* Sticky Top Section for Pinned Categories */
        #asset-panel-pinned { position: sticky; top: 90px; z-index: 9; background: #0f0f0f; }

        /* Category Group Styles */
        .main-category-header {
            font-size: 14px;
            font-weight: 700;
            color: #e0e0e0;
            padding: 12px 16px 8px;
            background: #0f0f0f;
            border-bottom: 1px solid #2a2a2a;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            position: sticky;
            top: 0; /* Adjust if pinned section height changes */
            z-index: 8;
        }
        .asset-category-group .category-header {
            padding-left: 24px;
        }

        /* Asset/Item Styles */
        .asset-category{border-bottom:1px solid #2a2a2a;}
        .category-header{padding:2px 16px;font-size:13px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none;transition:background .15s ease;}
        .category-header:hover{background:#1a1a1a;}
        .category-toggle{font-size:10px;}
        .category-items{padding:0;max-height:2000px;overflow:hidden;transition:max-height .3s ease;}
        .category-items.collapsed{max-height:0;}

        /* List View */
        .asset-items-list .asset-item{display:flex;gap:8px;padding:2px 16px;cursor:pointer;font-size:13px;transition:background .15s ease;align-items:center;}
        .asset-items-list .asset-item:hover{background:#1a1a1a;}
        .asset-items-list .asset-thumbnail{width:32px;height:32px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:4px;flex-shrink:0;background-size:cover;background-position:center;position:relative;}
        .asset-items-list .asset-info{flex:1;display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;}
        .asset-items-list .asset-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        
        /* Grid View */
        .asset-items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 2px; padding: 0px; }
        .asset-items-grid .asset-item { flex-direction: column; gap: 2px; padding: 2px; padding-bottom:4px; text-align: center; height: auto; align-items: center; display: flex; cursor: pointer; }
        .asset-items-grid .asset-thumbnail { width: 64px; height: 64px; margin-bottom: 4px; }
        .asset-items-grid .asset-name { font-size: 10px; white-space: normal; line-height: 1.2; word-break: break-word; }
        .asset-items-grid .favorite-btn { position: absolute; top: 0; right: 0; }
        .asset-items-grid .asset-info { line-height: 0; }
        .asset-items-grid .asset-info .asset-name { line-height: 1; font-size: 11px; }

        .asset-thumbnail.loading::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(74,158,255,.2),transparent);animation:shimmer 1.5s infinite;}
        @keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(100%);}}

        .favorite-btn{background:none;border:none;color:#666;font-size:14px;cursor:pointer;padding:4px;opacity:0;transition:opacity .15s ease;}
        .asset-item:hover .favorite-btn{opacity:1;}
        .favorite-btn.active{color:#ffd700;opacity:1!important;}
    `;
    document.head.appendChild(style);
}