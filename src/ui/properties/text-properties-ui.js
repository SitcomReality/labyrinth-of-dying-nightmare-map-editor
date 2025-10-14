import { BasePropertiesUI } from './base-properties-ui.js';

export class TextPropertiesUI extends BasePropertiesUI {
    constructor(mapObject, container, mapManager) {
        super(mapObject, container, mapManager);
        this.textObj = mapObject.object;
        this.config = this.textObj.config;
    }

    render() {
        this.container.innerHTML = `
            ${this.renderHeader('Text Properties')}
            <div class="properties-content">
                ${this.renderNameInput()}
                ${this.renderPositionInput()}
                ${this.renderRotationInput()}
                ${this.renderTextSpecificProperties()}
                ${this.renderCopyPaste()}
            </div>
        `;
        this.attachCommonListeners();
        this.attachTextListeners();
        this.attachCopyPasteListeners();
    }

    renderTextSpecificProperties() {
        return `
            <div class="property-group">
                <label>Text Content</label>
                <textarea id="text-content" rows="3" style="width:100%; padding:8px; background:#0a0a0a; border:1px solid #2a2a2a; color:#e0e0e0; border-radius:4px; font-family:'Noto Sans'; font-size:13px; resize:vertical;">${this.config.text}</textarea>
            </div>
            <div class="property-group">
                <label>Font Size</label>
                <input type="number" id="text-font-size" value="${this.config.fontSize}" min="0.1" max="10" step="0.1"/>
            </div>
            <div class="property-group">
                <label>Extrusion Depth</label>
                <input type="number" id="text-extrusion" value="${this.config.extrusionDepth}" min="0" max="5" step="0.1"/>
            </div>
            <div class="property-group property-color-group">
                <label for="text-color">Color</label>
                <input type="color" id="text-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
            </div>
        `;
    }

    attachTextListeners() {
        this.addListener('#text-content', 'change', (e) => {
            this.textObj.setText(e.target.value);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#text-font-size', 'input', (e) => {
            this.textObj.setFontSize(parseFloat(e.target.value));
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#text-extrusion', 'input', (e) => {
            this.textObj.setExtrusionDepth(parseFloat(e.target.value));
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#text-color', 'change', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.textObj.setColor(color);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });
    }

    handleCopy() {
        const copyBtn = this.container.querySelector('#copy-props-btn');
        const payload = {
            type: 'text',
            props: {
                config: { ...this.textObj.config },
                name: this.mapObject.name
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
            if (data.type !== 'text') { /* allow but warn? */ }
            const p = data.props || {};

            if (p.config) {
                if (p.config.text !== undefined) this.textObj.setText(p.config.text);
                if (p.config.fontSize !== undefined) this.textObj.setFontSize(p.config.fontSize);
                if (p.config.extrusionDepth !== undefined) this.textObj.setExtrusionDepth(p.config.extrusionDepth);
                if (p.config.color !== undefined) this.textObj.setColor(p.config.color);
            }

            if (p.name !== undefined) {
                this.mapObject.name = p.name;
                this.textObj.name = p.name;
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
}

