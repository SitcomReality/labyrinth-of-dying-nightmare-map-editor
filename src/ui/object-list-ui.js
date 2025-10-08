export class ObjectListUI {
    constructor(mapManager, toolManager) {
        this.mapManager = mapManager;
        this.toolManager = toolManager;
        this.container = null;
        this.isCollapsed = false;
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('mapObjectsChanged', () => this.updateList());
        window.addEventListener('objectSelected', (e) => this.highlightItem(e.detail.id));
        window.addEventListener('objectDeselected', () => this.clearHighlight());
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'panel-section';
        this.container.innerHTML = `
            <div class="panel-section-header" id="object-list-header">
                <h3>Scene Objects</h3>
                <span class="panel-section-toggle">▼</span>
            </div>
            <div class="panel-section-content">
                <div class="object-list" id="object-list">
                    <div class="empty-state">No objects in scene</div>
                </div>
            </div>
        `;
        
        document.getElementById('sidebar-right').appendChild(this.container);
        
        // Toggle collapse
        this.container.querySelector('#object-list-header').addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            this.container.querySelector('.panel-section-header').classList.toggle('collapsed', this.isCollapsed);
        });
        
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .object-list {
                padding: 0;
                max-height: 300px;
                overflow-y: auto;
            }
            
            .empty-state {
                padding: 32px 16px;
                text-align: center;
                color: #666;
                font-size: 13px;
            }
            
            .object-list-item {
                padding: 10px 16px;
                cursor: pointer;
                font-size: 13px;
                border-bottom: 1px solid #1a1a1a;
                transition: background 0.15s ease;
            }
            
            .object-list-item:hover {
                background: #1a1a1a;
            }
            
            .object-list-item.selected {
                background: #4a9eff;
                color: #fff;
            }
            
            .object-list-item.light-object {
                background: rgba(74, 158, 255, 0.1);
                border-left: 3px solid #4a9eff;
            }
            
            .object-list-item.light-object.selected {
                background: #4a9eff;
                border-left: 3px solid #fff;
            }
            
            .object-list-item.text-object {
                background: rgba(74, 158, 255, 0.1);
                border-left: 3px solid #4a9eff;
            }
            
            .object-list-item.text-object.selected {
                background: #4a9eff;
                border-left: 3px solid #fff;
            }
            
            .object-list-section-header {
                padding: 8px 16px;
                font-size: 11px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: #0a0a0a;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    updateList() {
        const listContainer = this.container.querySelector('#object-list');
        
        if (this.mapManager.objects.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No objects in scene</div>';
            return;
        }
        
        // Separate lights, text, and other objects
        const lights = this.mapManager.objects.filter(o => o.type === 'light');
        const texts = this.mapManager.objects.filter(o => o.type === 'text');
        const shapes = this.mapManager.objects.filter(o => o.type === 'shape');
        const connectors = this.mapManager.objects.filter(o => o.type === 'connector');
        const others = this.mapManager.objects.filter(o => o.type !== 'light' && o.type !== 'text' && o.type !== 'shape' && o.type !== 'connector');
        
        let html = '';
        
        // Lights section first
        if (lights.length > 0) {
            html += '<div class="object-list-section-header">Lights</div>';
            html += lights.map(obj => `
                <div class="object-list-item light-object" data-id="${obj.id}">
                    💡 ${obj.name || obj.assetName}
                </div>
            `).join('');
        }
        
        // Text section
        if (texts.length > 0) {
            html += '<div class="object-list-section-header">Text</div>';
            html += texts.map(obj => `
                <div class="object-list-item text-object" data-id="${obj.id}">
                    📝 ${obj.name || obj.assetName}
                </div>
            `).join('');
        }
        
        // Shapes section
        if (shapes.length > 0) {
            html += '<div class="object-list-section-header">Shapes</div>';
            html += shapes.map(obj => `
                <div class="object-list-item text-object" data-id="${obj.id}">
                    ■ ${obj.name || obj.assetName}
                </div>
            `).join('');
        }
        
        // Connectors section
        if (connectors.length > 0) {
            html += '<div class="object-list-section-header">Connectors</div>';
            html += connectors.map(obj => `
                <div class="object-list-item text-object" data-id="${obj.id}">
                    ☍ ${obj.name || obj.assetName}
                </div>
            `).join('');
        }
        
        // Other objects section
        if (others.length > 0) {
            html += '<div class="object-list-section-header">Objects</div>';
            html += others.map(obj => `
                <div class="object-list-item" data-id="${obj.id}">
                    ${obj.name || obj.assetName}
                </div>
            `).join('');
        }
        
        listContainer.innerHTML = html;
        
        // Attach click handlers
        listContainer.querySelectorAll('.object-list-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const mapObject = this.mapManager.getObjectById(id);
                if (mapObject) {
                    this.toolManager.setTool('select');
                    const objectToSelect = (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape' || mapObject.type === 'connector') 
                        ? mapObject.object.container 
                        : mapObject.object;
                    this.toolManager.tools.select.selectObject(objectToSelect);
                }
            });
        });
    }

    highlightItem(id) {
        this.clearHighlight();
        const item = this.container.querySelector(`.object-list-item[data-id="${id}"]`);
        if (item) {
            item.classList.add('selected');
            // Scroll into view if needed
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    clearHighlight() {
        this.container.querySelectorAll('.object-list-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
    }
}