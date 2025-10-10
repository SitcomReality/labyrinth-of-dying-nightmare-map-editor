// Responsible for DOM creation and rendering of maps hub lists/details.
export class MapsHubRenderer {
  constructor(saveManager, mapManager, historyManager) {
    this.saveManager = saveManager;
    this.mapManager = mapManager;
    this.historyManager = historyManager;
    this.backdrop = document.getElementById('modal-backdrop');
    this.container = null;
  }

  create() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'maps-hub-dialog';
    this.container.className = 'modal-dialog';
    this.container.innerHTML = `
      <div class="modal-header">
        <h2>Maps Hub</h2>
        <button class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-content">
        <div class="maps-hub-left">
          <div class="maps-hub-tabs" style="display:flex; gap:8px;">
            <button id="maps-tab-local" class="modal-btn primary-btn" style="flex:1;">Local</button>
            <button id="maps-tab-shared" class="modal-btn" style="flex:1;">Shared</button>
          </div>
          <div class="maps-hub-list-wrap">
            <div id="maps-hub-list" class="map-list"></div>
          </div>
        </div>

        <div class="maps-hub-right" id="maps-hub-right">
          <div class="empty-state preview-placeholder" style="color:#888; text-align:center; padding:24px;">Select a map to preview</div>
          <div id="maps-hub-right-content" style="display:none; flex-direction:column; gap:12px;">
            <img class="preview-thumb" style="width:100%;height:220px;object-fit:cover;border-radius:4px;border:1px solid #1a1a1a;background:#0a0a0a;" src="" alt="">
            <div id="maps-hub-right-meta" class="preview-meta"></div>
            <div id="maps-hub-right-actions"></div>
            <div id="maps-hub-details" style="margin-top:8px;"></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div style="margin-right:auto;display:flex;gap:8px;flex-wrap:wrap;">
          <button id="maps-hub-new-btn" class="modal-btn">New</button>
          <button id="maps-hub-import-btn" class="modal-btn">Import</button>
          <button id="maps-hub-export-current-btn" class="modal-btn">Export XML</button>
          <button id="maps-hub-export-json-btn" class="modal-btn">Export JSON</button>
          <button id="maps-hub-save-current-btn" class="modal-btn primary-btn">Save Current</button>
        </div>
        <button id="maps-hub-share-btn" class="modal-btn primary-btn">Share Selected</button>
        <button id="maps-hub-close-btn" class="modal-btn">Close</button>
      </div>
    `;
    document.body.appendChild(this.container);
    this.attachBasicHandlers();

    // New: tab wiring & state
    this.currentTab = 'local'; // 'local' or 'shared'
    this.container.querySelector('#maps-tab-local').addEventListener('click', () => this.switchTab('local'));
    this.container.querySelector('#maps-tab-shared').addEventListener('click', () => this.switchTab('shared'));
  }

  attachBasicHandlers() {
    this.container.querySelector('.modal-close-btn')?.addEventListener('click', () => this.hide());
    this.backdrop?.addEventListener('click', () => this.hide());
    this.container.querySelector('#maps-hub-close-btn')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#maps-hub-save-current-btn')?.addEventListener('click', () => this.saveCurrent());
    this.container.querySelector('#maps-hub-export-current-btn')?.addEventListener('click', () => this.exportCurrent());
    this.container.querySelector('#maps-hub-export-json-btn')?.addEventListener('click', () => this.exportCurrentJSON());
    this.container.querySelector('#maps-hub-import-btn')?.addEventListener('click', () => this.importMap());
    this.container.querySelector('#maps-hub-new-btn')?.addEventListener('click', () => this.newMap());
  }

  show() {
    this.create();
    this.renderList();
    this.container.style.display = 'flex';
    this.backdrop.style.display = 'block';
    setTimeout(() => {
      this.container.style.opacity = '1';
      this.backdrop.style.opacity = '1';
    }, 10);
  }

  hide() {
    if (!this.container) return;
    this.container.style.opacity = '0';
    this.backdrop.style.opacity = '0';
    setTimeout(() => {
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
      if (this.backdrop) this.backdrop.style.display = 'none';
    }, 300);
  }

  renderList() {
    if (!this.container) this.create();
    // Delegate to appropriate renderer based on current tab
    if (this.currentTab === 'shared') {
      this.renderSharedList();
      return;
    }

    const listEl = this.container.querySelector('#maps-hub-list');
    const maps = this.saveManager.getSavedMaps();
    if (!maps || maps.length === 0) {
      listEl.innerHTML = '<div class="empty-state" style="padding:24px;color:#888;">No saved maps.</div>';
      return;
    }

    // Use a placeholder image when thumbnail is missing to avoid broken img icon.
    const placeholder = '/sitcomreality.png';
    listEl.innerHTML = maps.map(m => {
      const src = m.thumbnail ? m.thumbnail : placeholder;
      return `
      <div class="map-list-item" data-map-name="${m.name}">
        <img class="preview-thumb" src="${src}" alt="">
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-weight:600;">${m.name}</div>
          <div style="font-size:12px;color:#888;">${(m.objectCount||0)} objects • ${m.lastModified ? new Date(m.lastModified).toLocaleString() : 'unknown'}</div>
        </div>
      </div>
    `;
    }).join('');
    // attach click handlers
    listEl.querySelectorAll('.map-list-item').forEach(item => {
      item.addEventListener('click', () => this.selectMap(item.dataset.mapName));
    });
  }

  switchTab(tab) {
    if (this.currentTab === tab) return;
    this.currentTab = tab;
    const localBtn = this.container.querySelector('#maps-tab-local');
    const sharedBtn = this.container.querySelector('#maps-tab-shared');
    if (tab === 'local') {
      localBtn.classList.add('primary-btn');
      sharedBtn.classList.remove('primary-btn');
      this.renderList();
    } else {
      sharedBtn.classList.add('primary-btn');
      localBtn.classList.remove('primary-btn');
      this.renderSharedList();
    }
  }

  async renderSharedList() {
    if (!this.container) this.create();
    const listEl = this.container.querySelector('#maps-hub-list');
    listEl.innerHTML = '<div class="empty-state" style="padding:24px;color:#888;">Loading shared maps...</div>';

    // Attempt to use WebsimSocket collection API to fetch shared maps
    try {
      // Prefer the global WebsimSocket constructor if available; collection.getList() may be async.
      if (typeof WebsimSocket === 'undefined') throw new Error('WebsimSocket not available');
      const room = new WebsimSocket();
      const coll = room.collection('shared_maps_v2');
      if (!coll || !coll.getList) throw new Error('Shared maps collection not available');

      // getList may be synchronous or return a Promise; await to handle both cases
      const raw = await Promise.resolve(coll.getList());
      const items = Array.isArray(raw) ? [...raw].reverse() : [];
      if (items.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding:24px;color:#888;">No public/shared maps found.</div>';
        return;
      }

      const placeholder = '/sitcomreality.png';
      listEl.innerHTML = items.map(r => {
        const map = r;
        const meta = map.mapData?.metadata || {};
        const name = map.mapName || meta.name || (map.mapData?.name) || 'Shared Map';
        const thumb = map.thumbnail || meta.thumbnail || placeholder;
        const by = map.username || map.created_by || map.author || (map.comment?.author?.username) || 'unknown';
        const created = map.created_at ? new Date(map.created_at).toLocaleString() : (meta.lastModified ? new Date(meta.lastModified).toLocaleString() : 'unknown');
        const objCount = map.objectCount || meta.objectCount || (map.mapData?.objects?.length) || 0;
        return `
          <div class="map-list-item" data-shared-id="${map.id}">
            <img class="preview-thumb" src="${thumb}" alt="">
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
              <div style="font-weight:600;">${name}</div>
              <div style="font-size:12px;color:#888;">By ${by} • ${objCount} objects • ${created}</div>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.map-list-item').forEach(item => {
        item.addEventListener('click', async () => {
          const id = item.dataset.sharedId;
          const rec = items.find(r => r.id === id);
          if (!rec) return;
          // show combined preview + details in right column
          const rightWrap = this.container.querySelector('#maps-hub-right');
          const rightContent = this.container.querySelector('#maps-hub-right-content');
          const placeholderImg = rec.thumbnail || rec.mapData?.metadata?.thumbnail || '/sitcomreality.png';
          rightWrap.querySelector('.preview-placeholder')?.remove();
          rightContent.style.display = 'flex';
          const img = rightContent.querySelector('.preview-thumb');
          img.src = placeholderImg;
          const name = rec.mapName || rec.mapData?.metadata?.name || 'Shared Map';
          const by = rec.username || 'unknown';
          const created = rec.created_at ? new Date(rec.created_at).toLocaleString() : (rec.mapData?.metadata?.lastModified ? new Date(rec.mapData.metadata.lastModified).toLocaleString() : 'unknown');
          const objCount = rec.objectCount || (rec.mapData?.objects?.length) || 0;
          this.container.querySelector('#maps-hub-right-meta').innerHTML = `<div style="font-weight:600;">${name}</div><div style="font-size:12px;color:#888;">By ${by} • ${objCount} objects • ${created}</div>`;
          // actions
          const actions = this.container.querySelector('#maps-hub-right-actions');
          actions.innerHTML = `<div style="display:flex;gap:8px;"><button id="maps-hub-load-shared" class="modal-btn primary-btn">Load</button><button id="maps-hub-copy-shared" class="modal-btn">Copy to Local</button></div>`;

          const detailsEl = this.container.querySelector('#maps-hub-details');
          detailsEl.innerHTML = ''; // keep additional details area available

          detailsEl.querySelector && detailsEl.querySelectorAll('*').forEach(n => n.remove());

          // load shared map into local storage and scene when clicking Load or Copy
          actions.querySelector('#maps-hub-load-shared')?.addEventListener('click', async () => {
            try {
              const parsed = typeof rec.mapData === 'string' ? JSON.parse(rec.mapData) : (rec.mapData || {});
              const nameToUse = rec.mapName || parsed.metadata?.name || `shared_${rec.id}`;
              localStorage.setItem(`map_${nameToUse}`, JSON.stringify(parsed));
              this.saveManager.loadMap(nameToUse);
              this.historyManager.clear();
              this.hide();
            } catch (err) {
              console.error('Failed to load shared map', err);
              alert('Failed to load shared map.');
            }
          });
          actions.querySelector('#maps-hub-copy-shared')?.addEventListener('click', async () => {
            try {
              const parsed = typeof rec.mapData === 'string' ? JSON.parse(rec.mapData) : (rec.mapData || {});
              const nameToUse = rec.mapName || parsed.metadata?.name || `shared_${rec.id}`;
              localStorage.setItem(`map_${nameToUse}`, JSON.stringify(parsed));
              alert(`Copied shared map to local as "${nameToUse}".`);
              this.renderList();
            } catch (err) {
              console.error('Failed to copy shared map', err);
              alert('Failed to copy shared map.');
            }
          });
        });
      });
    } catch (err) {
      console.warn('Could not load shared maps', err);
      listEl.innerHTML = `<div class="empty-state" style="padding:24px;color:#888;">Unable to load shared maps: ${err.message || err}</div>`;
    }
  }

  selectMap(name) {
    const maps = this.saveManager.getSavedMaps();
    const map = maps.find(m => m.name === name);
    const detailsEl = this.container.querySelector('#maps-hub-details');
    const rightContent = this.container.querySelector('#maps-hub-right-content');
    const rightMeta = this.container.querySelector('#maps-hub-right-meta');

    if (!map) {
      detailsEl.innerHTML = '<div class="empty-state" style="color:#888;">Map not found.</div>';
      return;
    }

    // Update consolidated right column
    const ph = this.container.querySelector('.preview-placeholder');
    ph?.remove();
    rightContent.style.display = 'flex';
    const img = this.container.querySelector('#maps-hub-right-content .preview-thumb');
    img.src = map.thumbnail || '/sitcomreality.png';
    rightMeta.innerHTML = `<div style="font-weight:600;">${map.name}</div><div style="font-size:12px;color:#888;">${(map.objectCount||0)} objects • ${map.lastModified ? new Date(map.lastModified).toLocaleString() : 'unknown'}</div>`;

    detailsEl.innerHTML = `<div style="display:flex;gap:8px;"><button id="maps-hub-load" class="modal-btn primary-btn">Load</button><button id="maps-hub-delete" class="modal-btn danger-btn">Delete</button></div>`;

    detailsEl.querySelector('#maps-hub-load')?.addEventListener('click', () => {
      if (this.mapManager.isDirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      this.saveManager.loadMap(map.name);
      this.historyManager.clear();
      this.hide();
    });

    detailsEl.querySelector('#maps-hub-delete')?.addEventListener('click', () => {
      if (!confirm(`Delete "${map.name}"? This cannot be undone.`)) return;
      this.saveManager.deleteMap(map.name);
      this.renderList();
      detailsEl.innerHTML = '<div class="empty-state" style="color:#888;">Select a map to see details</div>';
    });

    // store selected name for share action
    this.selectedMapName = map.name;
  }

  saveCurrent() {
    const defaultName = this.mapManager.mapName?.startsWith('Untitled') ? '' : (this.mapManager.mapName || '');
    const name = prompt('Save current map as:', defaultName) || defaultName || `Untitled Map`;
    if (!name) return;
    try { this.saveManager.saveMap(name); alert(`Saved as "${name}"`); this.renderList(); }
    catch (e) { alert('Save failed: ' + (e.message || e)); }
  }

  exportCurrent() {
    try {
      const xml = this.mapManager.exportXML();
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.mapManager.mapName}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + (e.message || e)); }
  }

  exportCurrentJSON() {
    try {
      const data = this.saveManager.getMapData(this.mapManager.mapName) || this.mapManager.serialize();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.mapManager.mapName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export JSON failed: ' + (e.message || e)); }
  }

  importMap() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json'; input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) { input.remove(); return; }
      try {
        const text = await file.text(); const parsed = JSON.parse(text);
        const name = parsed?.metadata?.name || parsed?.name || file.name.replace(/\.[^.]+$/, '');
        localStorage.setItem(`map_${name}`, JSON.stringify(parsed));
        const ok = this.saveManager.loadMap(name);
        if (!ok) throw new Error('Failed to load imported map.');
        alert(`Imported and loaded "${name}"`); this.renderList();
      } catch (err) {
        console.error('Import error', err); alert('Failed to import map: invalid file.');
      } finally { input.remove(); }
    });
    input.click();
  }

  newMap() {
    const proceed = !this.mapManager.isDirty || confirm('Unsaved changes will be lost. Create new map?');
    if (!proceed) return;
    this.mapManager.clear();
    this.historyManager.clear();
    this.mapManager.mapName = 'Untitled Map';
    window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
    this.renderList();
  }
}