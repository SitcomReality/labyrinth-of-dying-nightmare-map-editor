import { createCategoryElement, sortAssets } from './render-category.js';
import { generateThumbnailsForContainer } from './render-thumbnails.js';

export function renderAllCategories(renderer) {
    const mainWrap = document.getElementById('asset-categories');
    const pinnedWrap = document.getElementById('asset-panel-pinned');
    if (!mainWrap || !pinnedWrap) return;

    mainWrap.innerHTML = '';
    pinnedWrap.innerHTML = '';
    
    const categories = renderer.assetManager.getAllCategories();
    const state = renderer.state;

    const categoryTree = {};
    categories.forEach(catString => {
        const parts = catString.split(' / ');
        let currentLevel = categoryTree;
        parts.forEach((part, i) => {
            if (!currentLevel[part]) {
                currentLevel[part] = { _assets: [] };
            }
            if (i === parts.length - 1) {
                currentLevel[part]._assets = renderer.assetManager.getAssetsByCategory(catString);
            }
            currentLevel = currentLevel[part];
        });
    });

    // Favorites & Recently Used (Pinned)
    if (state.favorites.length) {
        // Exclude items that are also in recently used from favorites list to avoid redundancy
        const faves = state.favorites.filter(f => !state.recentlyUsed.includes(f));
        if (faves.length > 0) {
            pinnedWrap.appendChild(createCategoryElement('⭐ Favorites', faves, false, state, renderer.assetManager, sortAssets));
        }
    }
    if (state.recentlyUsed.length) {
        pinnedWrap.appendChild(createCategoryElement('🕐 Recently Used', state.recentlyUsed.slice(0,10), false, state, renderer.assetManager, sortAssets));
    }

    // Note: "Special Assets" now appears as a normal top-level category with subcategories (e.g. 'Special Assets / Lights', 'Special Assets / Shapes').
    // We intentionally do not pin Special Assets; it will be rendered below according to categoryHierarchy order.

    Object.keys(categoryTree).filter(c => c !== 'Special Assets').sort().forEach(mainCategory => {
        const subcategories = categoryTree[mainCategory];
        if (subcategories._assets.length > 0) {
             const assets = sortAssets(subcategories._assets, state);
             mainWrap.appendChild(createCategoryElement(mainCategory, assets, false, state, renderer.assetManager, sortAssets));
        } else {
            const mainCatEl = document.createElement('div');
            mainCatEl.className = 'asset-category-group';
            mainCatEl.innerHTML = `<div class="main-category-header">${mainCategory}</div>`;
            Object.keys(subcategories).filter(s => s !== '_assets').sort().forEach(subCategoryName => {
                const assets = sortAssets(subcategories[subCategoryName]._assets, state);
                mainCatEl.appendChild(createCategoryElement(subCategoryName, assets, false, state, renderer.assetManager, sortAssets, `${mainCategory} / ${subCategoryName}`));
            });
            mainWrap.appendChild(mainCatEl);
        }
    });

    // Render Special Assets group explicitly so it appears above CONSTRUCTION (if present in categoryTree)
    if (categoryTree['Special Assets']) {
        const mainCatEl = document.createElement('div');
        mainCatEl.className = 'asset-category-group';
        mainCatEl.innerHTML = `<div class="main-category-header">Special Assets</div>`;
        Object.keys(categoryTree['Special Assets']).filter(s => s !== '_assets').sort().forEach(subCategoryName => {
            const assets = sortAssets(categoryTree['Special Assets'][subCategoryName]._assets, state);
            mainCatEl.appendChild(createCategoryElement(subCategoryName, assets, false, state, renderer.assetManager, sortAssets, `Special Assets / ${subCategoryName}`));
        });
        // Insert Special Assets at the top of mainWrap (above other main categories)
        mainWrap.insertBefore(mainCatEl, mainWrap.firstChild);
    }

    // kick off thumbnails async generation for both containers
    renderer.generateThumbnails();
}

export function filterAssetsInView(container, query) {
    const mainContainer = container.querySelector('#asset-categories');
    const pinnedContainer = container.querySelector('#asset-panel-pinned');
    const lower = query.toLowerCase();

    const filterContainer = (c) => {
        if (!c) return;
        c.querySelectorAll('.asset-item').forEach(it => {
            const name = it.dataset.asset.toLowerCase();
            it.style.display = name.includes(lower) ? 'flex' : 'none';
        });
        c.querySelectorAll('.asset-category, .asset-category-group').forEach(cat => {
            const hasVisible = Array.from(cat.querySelectorAll('.asset-item')).some(i => i.style.display !== 'none');
            cat.style.display = hasVisible || query === '' ? 'block' : 'none';
        });
    };
    
    filterContainer(mainContainer);
    filterContainer(pinnedContainer);
}