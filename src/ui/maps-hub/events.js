// Event wiring for Maps Hub - connects renderer buttons and global events.
export function attachMapsHubEvents(renderer, owner) {
  // owner is MapsHubUI instance
  // keep local references
  const show = () => renderer.show();
  const hide = () => renderer.hide();

  // Wire toolbar or UI triggers if present
  window.addEventListener('openMapsHub', show);

  // If owner wants to expose show/hide
  owner.show = show;
  owner.hide = hide;
  owner.refresh = () => renderer.renderList();

  // Share button that operates on selected map if available
  const ensureShareButton = () => {
    // Listen for DOM changes and attach share behavior when dialog exists
    const tryAttach = () => {
      const shareBtn = document.querySelector('#maps-hub-share-btn');
      if (shareBtn) {
        shareBtn.removeEventListener('click', shareHandler);
        shareBtn.addEventListener('click', shareHandler);
      }
    };

    // Use global WebsimSocket (no import required)
    let wsRoom = null;
    const getRoom = () => wsRoom || (wsRoom = new WebsimSocket());

    const shareHandler = async () => {
      const name = renderer.selectedMapName;
      if (!name) { alert('No map selected to share'); return; }
      const full = renderer.saveManager.getMapData(name);
      if (!full) { alert('Could not find map data'); return; }
      try {
        const room = getRoom();
        await room.collection('shared_maps_v2').create({
          mapName: name,
          mapData: JSON.stringify(full),
          thumbnail: full.metadata?.thumbnail || '',
          objectCount: full.metadata?.objectCount || (full.mapData?.objects?.length || 0)
        });
        alert('Map shared to hub.');
      } catch (err) {
        console.error('Share failed', err);
        alert('Failed to share map: ' + (err.message || err));
      }
    };

    // Observe for dialog insertion
    const observer = new MutationObserver(() => tryAttach());
    observer.observe(document.body, { childList: true, subtree: true });
    // initial attempt
    tryAttach();
  };

  ensureShareButton();

  // Keep list up-to-date when maps change
  window.addEventListener('mapsChanged', () => {
    if (renderer.container && renderer.container.style.display !== 'none') {
      renderer.renderList();
    }
  });
}