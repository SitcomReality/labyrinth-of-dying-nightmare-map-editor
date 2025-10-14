export function renderHeader() {
  return `
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
}

