import { GLTFLoader } from 'gltf-loader';
import * as THREE from 'three';
import { LIGHT_ASSETS, isLightAsset, getLightConfig } from '../lights/light-assets.js';
import { TEXT_ASSETS, isTextAsset, getTextConfig } from '../text/text-assets.js';
import { SHAPE_ASSETS, isShapeAsset, getShapeConfig } from '../shapes/shape-assets.js';
import { CONNECTOR_ASSETS, isConnectorAsset, getConnectorConfig } from '../connectors/connector-assets.js';

const categoryHierarchy = [
    {
        name: 'Special Assets',
        subcategories: [
            { name: 'Lights', regex: /^$/ }, // handled specially for light assets
            { name: 'Shapes', regex: /^(text|cube|sphere|cylinder|cone|torus|icosahedron)/i }, // 3D text and shapes in Shapes
            { name: 'Connectors', regex: /^$/ } // handled specially for connector assets
        ]
    },
    {
        name: 'DECORATIONS',
        subcategories: [
            { name: 'Banners', regex: /^banner/ },
            { name: 'Small Items', regex: /^(bottle|candle|coin|key|plate)/ },
            { name: 'Wall Decorations', regex: /^(shelf|shelves|sword_shield|torch)/ },
            { name: 'Furniture', regex: /^(bed|chair|stool|table)/ },
            { name: 'Containers', regex: /^(barrel|box|chest|crates|keg|trunk)/ }
        ]
    },
    {
        name: 'CONSTRUCTION',
        subcategories: [
            { name: 'Floors', regex: /^(floor_dirt|floor_tile|floor_wood)/ },
            { name: 'Foundations', regex: /^floor_foundation/ },
            { name: 'Stairs', regex: /^stairs/ },
            { name: 'Ceilings', regex: /^ceiling/ },
            { name: 'Ornaments', regex: /^(barrier|column|pillar|rubble)/ }
        ]
    },
    {
        name: 'WALLS',
        subcategories: [
            { name: 'Walls', regex: /^wall/ }
        ]
    }
];

export class AssetManager {
    constructor(sceneManager, loadingManager) {
        this.sceneManager = sceneManager;
        this.loadingManager = loadingManager;
        this.loader = new GLTFLoader();
        this.assets = new Map();
        this.categories = new Map();
    }

    async loadAssets() {
        const assetPaths = await this.getAssetPaths();
        this.loadingManager.setTotalItems(assetPaths.length);
        this.loadingManager.updateStatus('Loading assets...');
        
        let loaded = 0;
        
        // Load all assets in parallel instead of sequentially
        const loadPromises = assetPaths.map(async (path) => {
            try {
                const gltf = await this.loader.loadAsync(path);
                const filename = this.getAssetFilename(path);
                const name = this.getAssetName(filename);
                const category = this.getAssetCategory(filename);
                
                this.assets.set(name, {
                    path,
                    model: gltf.scene,
                    category
                });
                
                if (!this.categories.has(category)) {
                    this.categories.set(category, []);
                }
                this.categories.get(category).push(name);
                
                loaded++;
                this.loadingManager.updateProgress(loaded, assetPaths.length);
                this.loadingManager.updateStatus(`Loading assets... (${loaded}/${assetPaths.length})`);
            } catch (error) {
                console.error(`Failed to load asset: ${path}`, error);
                loaded++;
                this.loadingManager.updateProgress(loaded, assetPaths.length);
            }
        });
        
        await Promise.all(loadPromises);
        
        // Add light assets
        this.addLightAssets();
        
        // Add text assets
        this.addTextAssets();

        // Add shape assets
        this.addShapeAssets();
        
        // Add connector assets
        this.addConnectorAssets();
        
        this.loadingManager.updateStatus('Initializing...');
    }
    
    addTextAssets() {
        // Ensure special subcategory exists
        const lightsCat = 'Special Assets / Lights';
        const shapesCat = 'Special Assets / Shapes';
        if (!this.categories.has(shapesCat)) this.categories.set(shapesCat, []);

        // Add text assets into Shapes
        Object.keys(TEXT_ASSETS).forEach(name => {
            this.assets.set(name, {
                type: 'text',
                config: TEXT_ASSETS[name],
                category: shapesCat
            });
            this.categories.get(shapesCat).push(name);
        });
    }

    addShapeAssets() {
        const shapesCat = 'Special Assets / Shapes';
        if (!this.categories.has(shapesCat)) this.categories.set(shapesCat, []);

        Object.keys(SHAPE_ASSETS).forEach(name => {
            this.assets.set(name, {
                type: 'shape',
                config: SHAPE_ASSETS[name],
                category: shapesCat
            });
            this.categories.get(shapesCat).push(name);
        });
    }

    addConnectorAssets() {
        const connectorsCat = 'Special Assets / Connectors';
        if (!this.categories.has(connectorsCat)) this.categories.set(connectorsCat, []);

        Object.keys(CONNECTOR_ASSETS).forEach(name => {
            this.assets.set(name, {
                type: 'connector',
                config: CONNECTOR_ASSETS[name],
                category: connectorsCat
            });
            this.categories.get(connectorsCat).push(name);
        });
    }

    addLightAssets() {
        // Put lights under Special Assets / Lights
        const lightsCat = 'Special Assets / Lights';
        if (!this.categories.has(lightsCat)) this.categories.set(lightsCat, []);

        Object.keys(LIGHT_ASSETS).forEach(name => {
            this.assets.set(name, {
                type: 'light',
                config: LIGHT_ASSETS[name],
                category: lightsCat
            });
            this.categories.get(lightsCat).push(name);
        });
    }

    getAssetPaths() {
        // Prefer a static manifest of basenames (smaller + predictable). If manifest import fails,
        // fall back to dynamic directory discovery at /zassets/gltf/.
        if (this._cachedPaths) return Promise.resolve(this._cachedPaths);
        return (async () => {
            try {
                // Try to load manifest module which exports ASSET_MANIFEST (basenames)
                const mod = await import('./asset-manifest.js');
                const names = mod.ASSET_MANIFEST || [];
                const paths = [];
                for (const n of names) {
                    // Only load the .gltf file. GLTFLoader handles associated .bin files automatically if referenced in the .gltf.
                    paths.push(`/zassets/gltf/${n}.gltf`);
                }
                // dedupe and filter
                const unique = Array.from(new Set(paths)).sort();
                this._cachedPaths = unique;
                return unique;
            } catch (e) {
                // manifest import failed -> fall back to directory listing
                try {
                    const resp = await fetch('/zassets/gltf/');
                    if (!resp.ok) throw new Error('Directory fetch failed');
                    const text = await resp.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const links = Array.from(doc.querySelectorAll('a'))
                        .map(a => a.getAttribute('href'))
                        .filter(Boolean)
                        .filter(h => /\.(gltf)$/i.test(h))
                        .map(h => h.startsWith('/') ? h : `/zassets/gltf/${h.replace(/^\.\//, '')}`);
                    const uniqueLinks = Array.from(new Set(links)).sort();
                    this._cachedPaths = uniqueLinks;
                    return uniqueLinks;
                } catch (err) {
                    console.warn('AssetManager.getAssetPaths: dynamic discovery failed, falling back to empty list.', err);
                    return [];
                }
            }
        })();
    }

    getAssetFilename(path) {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace('.gltf', '');
    }

    getAssetName(filename) {
        return filename.replace(/_/g, ' ');
    }

    getAssetCategory(filename) {
        for (const category of categoryHierarchy) {
            for (const subcategory of category.subcategories) {
                if (subcategory.regex.test(filename)) {
                    return `${category.name} / ${subcategory.name}`;
                }
            }
        }
        
        // Assign to a generic 'Walls' category if it matches, outside of Construction
        if (/^wall/.test(filename)) {
            return 'Walls';
        }

        return 'Other';
    }

    cloneAsset(name) {
        const asset = this.assets.get(name);
        if (!asset) return null;
        
        // Handle light assets
        if (asset.type === 'light') {
            return { type: 'light', config: getLightConfig(name), name };
        }
        
        // Handle text assets
        if (asset.type === 'text') {
            return { type: 'text', config: getTextConfig(name), name };
        }
        
        // Handle shape assets
        if (asset.type === 'shape') {
            return { type: 'shape', config: getShapeConfig(name), name };
        }
        
        // Handle connector assets
        if (asset.type === 'connector') {
            return { type: 'connector', config: getConnectorConfig(name), name };
        }
        
        const clone = asset.model.clone();
        clone.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        return clone;
    }

    getAllAssets() {
        return Array.from(this.assets.keys()).sort();
    }

    getAssetsByCategory(category) {
        return this.categories.get(category) || [];
    }

    getAllCategories() {
        return Array.from(this.categories.keys()).sort();
    }
    
    // Backwards-compatible API: some code expects discoverAssets()
    async discoverAssets() {
        // Ensure we only run once if called multiple times
        if (this._discovered) return;
        await this.loadAssets();
        this._discovered = true;
    }
}