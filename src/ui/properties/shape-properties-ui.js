import { BasePropertiesUI } from './base-properties-ui.js';
import { ComponentsEditor } from '../components/components-editor.js';

export class ShapePropertiesUI extends BasePropertiesUI {
    constructor(mapObject, container, mapManager) {
        super(mapObject, container, mapManager);
        this.shapeObj = mapObject.object;
        this.config = this.shapeObj.config;
    }

    render() {
        this.container.innerHTML = `
            ${this.renderHeader('Shape Properties')}
            <div class="properties-content">
                ${this.renderNameInput()}
                ${this.renderPositionInput()}
                ${this.renderRotationInput()}
                ${this.renderShapeSpecificProperties()}
                <div class="property-group">
                    <label>Object ID</label>
                    <input type="text" id="prop-ob-id" value="${this.mapObject.obId || ''}" placeholder="e.g., coin_001"/>
                </div>
                <div class="property-group">
                    <label>Components</label>
                    <div id="components-editor"></div>
                    <details style="margin-top:8px;">
                      <summary style="cursor:pointer;color:#888;">Advanced JSON</summary>
                      <textarea id="prop-components-raw" rows="6" style="width:100%;padding:8px;background:#0a0a0a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;font-size:13px;margin-top:8px;">${JSON.stringify(this.mapObject.components || {}, null, 2)}</textarea>
                    </details>
                </div>
                ${this.renderCopyPaste()}
            </div>
        `;
        this.attachCommonListeners();
        this.attachShapeListeners();
        this.attachCopyPasteListeners();
        this.attachSchemaListeners();
        this.initComponentsEditor();
    }

    renderShapeSpecificProperties() {
        const s = this.config.shape;
        const colorHTML = `
            <div class="property-group property-color-group">
                <label for="shape-color">Color</label>
                <input type="color" id="shape-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
            </div>`;
        if (s === 'box') {
            return colorHTML + `
            <div class="property-group">
                <label>Dimensions</label>
                <div class="property-row">
                    <input type="number" id="shape-width" step="0.1" value="${(this.config.width??1).toFixed(2)}"/>
                    <input type="number" id="shape-height" step="0.1" value="${(this.config.height??1).toFixed(2)}"/>
                    <input type="number" id="shape-depth" step="0.1" value="${(this.config.depth??1).toFixed(2)}"/>
                </div>
            </div>`;
        } else if (s === 'sphere' || s === 'icosahedron') {
            return colorHTML + `
            <div class="property-group">
                <label>Radius</label>
                <input type="number" id="shape-radius" step="0.1" value="${(this.config.radius??0.5).toFixed(2)}"/>
            </div>`;
        } else if (s === 'cylinder') {
            return colorHTML + `
            <div class="property-group">
                <label>Top/Bottom Radius, Height</label>
                <div class="property-row">
                    <input type="number" id="shape-radius-top" step="0.1" value="${(this.config.radiusTop??0.5).toFixed(2)}"/>
                    <input type="number" id="shape-radius-bottom" step="0.1" value="${(this.config.radiusBottom??0.5).toFixed(2)}"/>
                    <input type="number" id="shape-height" step="0.1" value="${(this.config.height??1).toFixed(2)}"/>
                </div>
            </div>`;
        } else if (s === 'cone') {
            return colorHTML + `
            <div class="property-group">
                <label>Base Radius, Height</label>
                <div class="property-row">
                    <input type="number" id="shape-radius" step="0.1" value="${(this.config.radius??0.5).toFixed(2)}"/>
                    <input type="number" id="shape-height" step="0.1" value="${(this.config.height??1).toFixed(2)}"/>
                </div>
            </div>`;
        } else if (s === 'torus') {
            return colorHTML + `
            <div class="property-group">
                <label>Radius, Tube</label>
                <div class="property-row">
                    <input type="number" id="shape-radius" step="0.1" value="${(this.config.radius??0.5).toFixed(2)}"/>
                    <input type="number" id="shape-tube" step="0.05" value="${(this.config.tube??0.2).toFixed(2)}"/>
                </div>
            </div>`;
        }
        return colorHTML;
    }

    attachShapeListeners() {
        this.addListener('#shape-color', 'change', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.shapeObj.setColor(color);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });
        const s = this.config.shape;
        const num = (sel) => {
            const el = this.container.querySelector(sel);
            return el ? parseFloat(el.value) : undefined;
        };
        const apply = (partial) => {
            this.shapeObj.setConfig(partial);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        };
        if (s === 'box') {
            this.addListener('#shape-width','input',()=>apply({ width: num('#shape-width') }));
            this.addListener('#shape-height','input',()=>apply({ height: num('#shape-height') }));
            this.addListener('#shape-depth','input',()=>apply({ depth: num('#shape-depth') }));
        } else if (s === 'sphere' || s === 'icosahedron') {
            this.addListener('#shape-radius','input',()=>apply({ radius: num('#shape-radius') }));
        } else if (s === 'cylinder') {
            this.addListener('#shape-radius-top','input',()=>apply({ radiusTop: num('#shape-radius-top') }));
            this.addListener('#shape-radius-bottom','input',()=>apply({ radiusBottom: num('#shape-radius-bottom') }));
            this.addListener('#shape-height','input',()=>apply({ height: num('#shape-height') }));
        } else if (s === 'cone') {
            this.addListener('#shape-radius','input',()=>apply({ radius: num('#shape-radius') }));
            this.addListener('#shape-height','input',()=>apply({ height: num('#shape-height') }));
        } else if (s === 'torus') {
            this.addListener('#shape-radius','input',()=>apply({ radius: num('#shape-radius') }));
            this.addListener('#shape-tube','input',()=>apply({ tube: num('#shape-tube') }));
        }
    }

    handleCopy() {
        const copyBtn = this.container.querySelector('#copy-props-btn');
        const payload = {
            type: 'shape',
            props: {
                config: { ...this.shapeObj.config },
                name: this.mapObject.name,
                obId: this.mapObject.obId || '',
                components: this.mapObject.components || {}
            }
        };
        sessionStorage.setItem('copiedObjectProperties', JSON.stringify(payload));
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Copy Properties' }, 900);
    }

    handlePaste() {
        const pasteBtn = this.container.querySelector('#paste-props-btn');
        const raw = sessionStorage.getItem('copiedObjectProperties');
        if (!raw) { alert('No properties copied'); return; }
        try {
            const data = JSON.parse(raw);
            if (data.type !== 'shape') { /* allow but warn? */ }
            const p = data.props || {};

            if (p.config) {
                if (p.config.color !== undefined) this.shapeObj.setColor(p.config.color);
            }

            if (p.name !== undefined) {
                this.mapObject.name = p.name;
                this.shapeObj.name = p.name;
            }

            if (p.obId !== undefined) {
                this.mapObject.obId = p.obId;
                this.mapManager.updateObjectProperties(this.mapObject, { obId: p.obId });
            }
            if (p.components !== undefined) {
                this.mapObject.components = p.components;
                this.mapManager.updateObjectProperties(this.mapObject, { components: p.components });
                this.container.querySelector('#prop-components').value = JSON.stringify(p.components, null, 2);
            }

            this.mapManager.updateObjectProperties(this.mapObject, {});
            this.render();

            const newPasteBtn = this.container.querySelector('#paste-props-btn');
            if (newPasteBtn) {
                newPasteBtn.textContent = 'Pasted ✓';
                setTimeout(() => { if(newPasteBtn) newPasteBtn.textContent = 'Paste Properties' }, 900);
            }
        } catch (e) {
            console.error('Paste failed', e);
            alert('Failed to paste properties');
        }
    }

    attachSchemaListeners() {
        const idEl = this.container.querySelector('#prop-ob-id');
        const compEl = this.container.querySelector('#prop-components-raw');
        idEl?.addEventListener('change', (e) => {
            this.mapObject.obId = e.target.value;
            this.mapManager.updateObjectProperties(this.mapObject, { obId: e.target.value });
        });
        compEl?.addEventListener('blur', (e) => {
            try {
                const parsed = JSON.parse(e.target.value || '{}');
                this.mapObject.components = parsed;
                this.mapManager.updateObjectProperties(this.mapObject, { components: parsed });
                this.initComponentsEditor(true);
            } catch (err) {
                alert('Invalid JSON in Components');
            }
        });
    }

    initComponentsEditor(skipResetRaw = false) {
        const host = this.container.querySelector('#components-editor');
        if (!host) return;
        host.innerHTML = '';
        const editor = new ComponentsEditor(host, this.mapObject.components || {}, (components) => {
            this.mapObject.components = components;
            this.mapManager.updateObjectProperties(this.mapObject, { components });
            if (!skipResetRaw) {
                const raw = this.container.querySelector('#prop-components-raw');
                if (raw) raw.value = JSON.stringify(components || {}, null, 2);
            }
        });
        editor.render();
    }
}