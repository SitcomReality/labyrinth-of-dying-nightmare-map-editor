export function addMapsHubStyles() {
  if (document.getElementById('maps-hub-styles')) return;
  const style = document.createElement('style');
  style.id = 'maps-hub-styles';
  style.textContent = `
    /* Basic modal overrides used by Maps Hub */
    #maps-hub-dialog { position:fixed; left:50%; top:50%; transform:translate(-50%, -50%); display:flex; flex-direction:column; width:90%; max-width:1000px; max-height:80vh; opacity:0; transition:opacity .25s ease; overflow:auto; z-index:10001; background:#0b0b0b; border-radius:8px; box-shadow:0 20px 60px rgba(0,0,0,0.6); }
    #maps-hub-dialog .modal-header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid #2a2a2a; }
    #maps-hub-dialog .modal-content { padding:12px; gap:12px; }
    #maps-hub-dialog .modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid #2a2a2a; }
    .modal-btn { padding:8px 12px; background:#1a1a1a; border:1px solid #2a2a2a; color:#e0e0e0; border-radius:4px; cursor:pointer; }
    .primary-btn { background:#4a9eff; border-color:#4a9eff; color:#fff; }
    .danger-btn { color:#ff4a4a; border-color:#2a2a2a; }
    .map-list-item:hover { background:#0f0f0f; }

    /* New structured layout for maps hub */
    #maps-hub-dialog .modal-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      align-items: start;
      box-sizing: border-box;
    }

    /* Left column: tabs + list */
    .maps-hub-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
      height: calc(80vh - 140px);
      min-height: 200px;
    }
    .maps-hub-tabs {
      display:flex; gap:8px;
    }
    .maps-hub-list-wrap {
      flex: 1;
      overflow:auto;
      border:1px solid #151515;
      background:#090909;
      border-radius:6px;
      padding:8px;
    }
    #maps-hub-list .map-list-item {
      display:flex;
      gap:12px;
      padding:8px;
      border-radius:6px;
      align-items:center;
      cursor:pointer;
      transition:background .15s ease;
      background: transparent;
    }
    #maps-hub-list .map-list-item + .map-list-item { margin-top:6px; }
    #maps-hub-list .map-list-item:hover { background:#0f0f0f; }
    #maps-hub-list .map-list-item .preview-thumb {
      width:110px;
      height:66px;
      object-fit:cover;
      border-radius:4px;
      border:1px solid #1a1a1a;
      background:#0a0a0a;
      flex-shrink:0;
    }
    #maps-hub-list .map-list-meta { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .map-list-title { font-weight:600; color:#e6eefc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .map-list-sub { font-size:12px; color:#888; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    /* center column: preview area (larger canvas/preview) */
    .maps-hub-preview {
      background:#0c0c0c;
      border:1px solid #151515;
      border-radius:6px;
      padding:12px;
      min-height: 320px;
      display:flex;
      flex-direction:column;
      gap:12px;
      align-items:stretch;
      justify-content:flex-start;
    }
    .maps-hub-preview .preview-thumb {
      width:100%;
      height:220px;
      object-fit:cover;
      border-radius:4px;
      background:#0a0a0a;
      border:1px solid #1a1a1a;
    }
    .maps-hub-preview .preview-meta { color:#aaa; font-size:13px; }

    /* right column: details + actions */
    .maps-hub-details {
      background:#0c0c0c;
      border:1px solid #151515;
      border-radius:6px;
      padding:12px;
      min-height: 200px;
      display:flex;
      flex-direction:column;
      gap:8px;
      box-sizing:border-box;
    }
    .maps-hub-details .detail-title { font-size:16px; font-weight:700; color:#e6eefc; }
    .maps-hub-details .detail-thumb { width:100%; height:140px; object-fit:cover; border-radius:4px; background:#0a0a0a; border:1px solid #1a1a1a; }

    /* controls row adjustments */
    #maps-hub-dialog .modal-footer { flex-wrap:wrap; gap:8px; align-items:center; }

    /* responsive for narrow viewports */
    @media (max-width: 900px) {
      #maps-hub-dialog .modal-content {
        grid-template-columns: 1fr;
      }
      .maps-hub-left, .maps-hub-preview, .maps-hub-details {
        min-height: auto;
        height: auto;
      }
    }
  `;
  document.head.appendChild(style);
}