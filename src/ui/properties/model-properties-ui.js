import { BasePropertiesUI } from './base-properties-ui.js';
import { ComponentsEditor } from '../components/components-editor.js';

export class ModelPropertiesUI extends BasePropertiesUI {
    constructor(mapObject, container, mapManager) {
        super(mapObject, container, mapManager);
    }

    render() {
        this.container.innerHTML = `
            ${this.renderHeader('Properties')}
            <div class="properties-content">
                ${this.renderNameInput()}
                ${this.renderPositionInput()}
                ${this.renderRotationInput()}
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
        this.attachCopyPasteListeners();
        this.attachSchemaListeners();
        this.initComponentsEditor();
    }

    handleCopy() {
        const copyBtn = this.container.querySelector('#copy-props-btn');
        const payload = {
            type: 'model',
            props: {
                name: this.container.querySelector('#prop-name')?.value || '',
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
            if (data.type !== 'model') {
                // Allow pasting across types for common properties
            }
            if (data.props?.name !== undefined) {
                this.mapObject.name = data.props.name;
                this.container.querySelector('#prop-name').value = data.props.name;
                this.mapManager.updateObjectProperties(this.mapObject, { name: data.props.name });
            }
            if (data.props?.obId !== undefined) {
                this.mapObject.obId = data.props.obId;
                this.mapManager.updateObjectProperties(this.mapObject, { obId: data.props.obId });
            }
            if (data.props?.components !== undefined) {
                this.mapObject.components = data.props.components;
                this.mapManager.updateObjectProperties(this.mapObject, { components: data.props.components });
                this.container.querySelector('#prop-components').value = JSON.stringify(data.props.components, null, 2);
            }
            pasteBtn.textContent = 'Pasted ✓';
            setTimeout(() => { if (pasteBtn) pasteBtn.textContent = 'Paste Properties' }, 900);
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
                // sync structured editor
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