export async function generateThumbnailsForContainer(container, assetManager, thumbnailGenerator) {
  const els = container.querySelectorAll('.asset-thumbnail.loading');
  for (const el of els) {
    const name = el.dataset.assetName;
    const asset = assetManager.assets.get(name);
    if (!asset) { el.classList.remove('loading'); el.classList.add('error'); continue; }
    try {
      let thumb;
      if (asset.type === 'light') {
        thumb = thumbnailGenerator.generateLightIcon(asset.config);
      } else if (asset.type === 'text') {
        thumb = thumbnailGenerator.generateTextIcon();
      } else if (asset.type === 'npc') {
        thumb = thumbnailGenerator.generateNpcIcon();
      } else {
        thumb = await thumbnailGenerator.generateThumbnail(asset.model, name, false);
      }
      el.style.backgroundImage = `url(${thumb})`;
    } catch(e) {
      console.warn('Thumb fail', name, e);
      el.classList.add('error');
    } finally {
      el.classList.remove('loading');
    }
  }
}