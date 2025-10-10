import { ToolbarUI } from './toolbar-ui.js';
import { AssetPanelUI } from './asset-panel-ui.js';
import { ObjectListUI } from './object-list-ui.js';
import { PropertiesPanelUI } from './properties-panel-ui.js';
import { EnvironmentPanelUI } from '../ui/environment-panel-ui.js';
import { MapsHubUI } from './maps-hub/index.js';
import { InfoBannerUI } from './info-banner-ui.js';
import { RotationPreviewManager } from '../preview/rotation-preview-manager.js';
import { NPCController } from '../npc/npc-controller.js';
import { MapMetadataUI } from './map-metadata-ui.js';

export class UIManager {
    constructor(app, assetManager, toolManager, mapManager, historyManager, saveManager) {
        this.app = app;
        this.assetManager = assetManager;
        this.toolManager = toolManager;
        this.mapManager = mapManager;
        this.historyManager = historyManager;
        this.saveManager = saveManager;
        
        this.mapsHub = new MapsHubUI(this.saveManager, this.mapManager, this.historyManager);
        this.toolbar = new ToolbarUI(toolManager, mapManager, historyManager);
        
        this.initAssetPanel();
        
        this.objectList = new ObjectListUI(mapManager, toolManager);
        this.propertiesPanel = new PropertiesPanelUI(mapManager);
        this.environmentPanel = new EnvironmentPanelUI(app.sceneManager);
        this.infoBanner = new InfoBannerUI();
        this.mapMetadata = new MapMetadataUI(this.mapManager);
        
        this.setupKeyboardShortcuts();
    }
    
    initAssetPanel() {
        if (window.app?.sceneManager) {
            this.assetPanel = new AssetPanelUI(this.assetManager, this.toolManager);
        } else {
            setTimeout(() => this.initAssetPanel(), 100);
        }
    }

    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.historyManager.redo();
                        } else {
                            this.historyManager.undo();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('openMapsHub'));
                        break;
                }
            } else if (e.key === 'Escape') {
                this.toolManager.setTool('select');
            }
        });
    }
}