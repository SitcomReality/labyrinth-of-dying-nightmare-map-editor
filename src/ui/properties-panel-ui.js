import { ModelPropertiesUI } from './properties/model-properties-ui.js';
import { LightPropertiesUI } from './properties/light-properties-ui.js';
import { TextPropertiesUI } from './properties/text-properties-ui.js';
import { ShapePropertiesUI } from './properties/shape-properties-ui.js';
import { ConnectorPropertiesUI } from './properties/connector-properties-ui.js';

export class PropertiesPanelUI {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.selectedObject = null;
        this.container = null;
        this.activePropertyUI = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('objectSelected', (e) => this.showProperties(e.detail));
        window.addEventListener('objectDeselected', () => this.hideProperties());
    }

    showProperties(mapObject) {
        this.hideProperties();
        this.selectedObject = mapObject;

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'properties-panel';
            const sidebar = document.getElementById('sidebar-right');
            sidebar.prepend(this.container);
        }

        switch (mapObject.type) {
            case 'light':
                this.activePropertyUI = new LightPropertiesUI(mapObject, this.container, this.mapManager);
                break;
            case 'text':
                this.activePropertyUI = new TextPropertiesUI(mapObject, this.container, this.mapManager);
                break;
            case 'shape':
                this.activePropertyUI = new ShapePropertiesUI(mapObject, this.container, this.mapManager);
                break;
            case 'connector':
                this.activePropertyUI = new ConnectorPropertiesUI(mapObject, this.container, this.mapManager);
                break;
            case 'model':
            default:
                this.activePropertyUI = new ModelPropertiesUI(mapObject, this.container, this.mapManager);
                break;
        }
        this.activePropertyUI.render();

        // Add a delete button to the properties panel (mirrors DeleteTool behavior)
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'delete-object-btn';
        deleteBtn.className = 'cinematic-btn';
        deleteBtn.textContent = 'Delete Object';
        deleteBtn.style.marginTop = '8px';
        this.container.querySelector('.properties-content')?.appendChild(deleteBtn);
        deleteBtn.addEventListener('click', () => {
            if (!confirm(`Delete "${mapObject.name || mapObject.assetName}"? This cannot be undone.`)) return;
            try {
                // record history similar to delete tool
                window.app?.historyManager?.recordAction('delete', { mapObject });
            } catch (e) { /* ignore history errors */ }
            // remove using mapManager (will route to proper controller)
            this.mapManager.removeObject(mapObject.object);
        });
    }

    hideProperties() {
        if (this.activePropertyUI) {
            this.activePropertyUI.destroy();
            this.activePropertyUI = null;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.selectedObject = null;
    }
}