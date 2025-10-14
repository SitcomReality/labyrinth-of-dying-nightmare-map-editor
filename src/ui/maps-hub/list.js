import { ASSET_MANIFEST } from '../../assets/asset-manifest.js'; // kept in case of future needs

export class MapsList {
  constructor(renderer) {
    this.renderer = renderer;
    this.saveManager = renderer.saveManager;
    this.mapManager = renderer.mapManager;
    this.historyManager = renderer.historyManager;
  }

  renderLocalList() {
    const listEl = this.renderer.container.querySelector('#maps-hub-list');
    const maps = this.saveManager.getSavedMaps();
    if (!maps || maps.length === 0) {
      listEl.innerHTML = '<div class=\"empty-state\" style=\"padding:24px;color:#888;\">No saved maps.</div>';
      return;
    }

    const placeholder = '/sitcomreality.png';
    listEl.innerHTML = maps.map(m => {
      const src = m.thumbnail ? m.thumbnail : placeholder;
      return `
      <div class=\"map-list-item\" data-map-name=\"${m.name}\">
        <img class=\"preview-thumb\" src=\"${src}\" alt=\"\">
        <div style=\"flex:1;display:flex;flex-direction:column;justify-content:center;\">
          <div style=\"font-weight:600;\">${m.name}</div>
          <div style=\"font-size:12px;color:#888;\">${(m.objectCount||0)} objects • ${m.lastModified ? new Date(m.lastModified).toLocaleString() : 'unknown'}</div>
        </div>
      </div>
    `).join('');
    listEl.querySelectorAll('.map-list-item').forEach(item => {
      item.addEventListener('click', () => this.handleSelectLocal(item.dataset.mapName));
    });
  }

  handleSelectLocal(name) {
    const maps = this.saveManager.getSavedMaps();
    const map = maps.find(m => m.name === name);
    const detailsEl = this.renderer.container.querySelector('#maps-hub-details');
    const rightContent = this.renderer.container.querySelector('#maps-hub-right-content');
    const rightMeta = this.renderer.container.querySelector('#maps-hub-right-meta');

    if (!map) {
      detailsEl.innerHTML = '<div class=\"empty-state\" style=\"color:#888;\">Map not found.</div>';
      return;
    }

    // Update right column
    const ph = this.renderer.container.querySelector('.preview-placeholder');
    ph?.remove();
    rightContent.style.display = 'flex';
    const img = this.renderer.container.querySelector('#maps-hub-right-content .preview-thumb');
    img.src = map.thumbnail || '/sitcomreality.png';
    rightMeta.innerHTML = `<div style=\"font-weight:600;\">${map.name}</div><div style=\"font-size:12px;color:#888;\">${(map.objectCount||0)} objects • ${map.lastModified ? new Date(map.lastModified).toLocaleString() : 'unknown'}</div>`;

    detailsEl.innerHTML = `<div style=\"display:flex;gap:8px;\"><button id=\"maps-hub-load\" class=\"modal-btn primary-btn\">Load</button><button id=\"maps-hub-delete\" class=\"modal-btn danger-btn\">Delete</button></div>`;

    detailsEl.querySelector('#maps-hub-load')?.addEventListener('click', () => {
      if (this.mapManager.isDirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      this.saveManager.loadMap(map.name);
      this.historyManager.clear();
      this.renderer.hide();
    });

    detailsEl.querySelector('#maps-hub-delete')?.addEventListener('click', () => {
      if (!confirm(`Delete \"${map.name}\"? This cannot be undone.`)) return;
      this.saveManager.deleteMap(map.name);
      this.renderLocalList();
      detailsEl.innerHTML = '<div class=\"empty-state\" style=\"color:#888;\">Select a map to see details</div>';
    });

    this.renderer.selectedMapName = map.name;
  }

  async renderSharedList() {
    const listEl = this.renderer.container.querySelector('#maps-hub-list');
    listEl.innerHTML = '<div class=\"empty-state\" style=\"padding:24px;color:#888;\">Loading shared maps...</div>';

    try {
      if (typeof WebsimSocket === 'undefined') throw new Error('WebsimSocket not available');
      const room = new WebsimSocket();
      const coll = room.collection('shared_maps_v2');
      if (!coll || !coll.getList) throw new Error('Shared maps collection not available');

      const raw = await Promise.resolve(coll.getList());
      const items = Array.isArray(raw) ? [...raw].reverse() : [];
      if (items.length === 0) {
        listEl.innerHTML = '<div class=\"empty-state\" style=\"padding:24px;color:#888;\">No public/shared maps found.</div>';
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
          <div class=\"map-list-item\" data-shared-id=\"${map.id}\">
            <img class=\"preview-thumb\" src=\"${thumb}\" alt=\"\">
            <div style=\"flex:1;display:flex;flex-direction:column;justify-content:center;\">
              <div style=\"font-weight:600;\">${name}</div>
              <div style=\"font-size:12px;color:#888;\">By ${by} • ${objCount} objects • ${created}</div>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.map-list-item').forEach(item => {
        item.addEventListener('click', async () => {
          const id = item.dataset.sharedId;
          const rec = items.find(r => r.id === id);
          if (!rec) return;
          this.showSharedPreview(rec);
        });
      });
    } catch (err) {
      console.warn('Could not load shared maps', err);
      listEl.innerHTML = `<div class=\"empty-state\" style=\"padding:24px;color:#888;\">Unable to load shared maps: ${err.message || err}</div>`;
    }
  }

  showSharedPreview(rec) {
    const rightWrap = this.renderer.container.querySelector('#maps-hub-right');
    const rightContent = this.renderer.container.querySelector('#maps-hub-right-content');
    const placeholderImg = rec.thumbnail || rec.mapData?.metadata?.thumbnail || '/sitcomreality.png';
    rightWrap.querySelector('.preview-placeholder')?.remove();
    rightContent.style.display = 'flex';
    const img = rightContent.querySelector('.preview-thumb');
    img.src = placeholderImg;
    const name = rec.mapName || rec.mapData?.metadata?.name || 'Shared Map';
    const by = rec.username || 'unknown';
    const created = rec.created_at ? new Date(rec.created_at).toLocaleString() : (rec.mapData?.metadata?.lastModified ? new Date(rec.mapData.metadata.lastModified).toLocaleString() : 'unknown');
    const objCount = rec.objectCount || (rec.mapData?.objects?.length) || 0;
    this.renderer.container.querySelector('#maps-hub-right-meta').innerHTML = `<div style=\"font-weight:600;\">${name}</div><div style=\"font-size:12px;color:#888;\">By ${by} • ${objCount} objects • ${created}</div>`;

    const actions = this.renderer.container.querySelector('#maps-hub-right-actions');
    actions.innerHTML = `<div style=\"display:flex;gap:8px;\"><button id=\"maps-hub-load-shared\" class=\"modal-btn primary-btn\">Load</button><button id=\"maps-hub-copy-shared\" class=\"modal-btn\">Copy to Local</button></div>`;

    const detailsEl = this.renderer.container.querySelector('#maps-hub-details');
    detailsEl.innerHTML = '';

    actions.querySelector('#maps-hub-load-shared')?.addEventListener('click', async () => {
      try {
        const parsed = typeof rec.mapData === 'string' ? JSON.parse(rec.mapData) : (rec.mapData || {});
        const nameToUse = rec.mapName || parsed.metadata?.name || `shared_${rec.id}`;
        localStorage.setItem(`map_${nameToUse}`, JSON.stringify(parsed));
        this.saveManager.loadMap(nameToUse);
        this.historyManager.clear();
        this.renderer.hide();
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
        alert(`Copied shared map to local as \"${nameToUse}\".`);
        this.renderLocalList();
      } catch (err) {
        console.error('Failed to copy shared map', err);
        alert('Failed to copy shared map.');
      }
    });
  }
}