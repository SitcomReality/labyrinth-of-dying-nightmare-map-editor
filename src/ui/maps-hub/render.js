// Responsible for DOM creation and rendering of maps hub lists/details.
export class MapsHubRenderer {
  constructor(saveManager, mapManager, historyManager) {
    this.saveManager = saveManager;
    this.mapManager = mapManager;
    this.historyManager = historyManager;
    this.backdrop = document.getElementById('modal-backdrop');
    this.container = null;
    this.currentTab = 'local';
    this.listComponent = new MapsList(this);
    this.detailComponent = new DetailPane(this);
  }

  create() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'maps-hub-dialog';
    this.container.className = 'modal-dialog';
    this.container.innerHTML = renderHeader();
    document.body.appendChild(this.container);
    this.attachBasicHandlers();

    // Wire tabs
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
    if (this.currentTab === 'shared') {
      this.listComponent.renderSharedList();
      return;
    }
    this.listComponent.renderLocalList();
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
      this.renderList();
    }
  }

  // delegate to components for selection/details/actions
  selectMap(name) { this.listComponent.handleSelectLocal(name); }
  showSharedPreview(rec) { this.listComponent.showSharedPreview(rec); }

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
      const data = this.saveManager.getMapData(this.mapManager.mapName, true) || this.mapManager.serialize();
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