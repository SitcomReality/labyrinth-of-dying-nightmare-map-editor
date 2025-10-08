import { BasePropertiesUI } from './base-properties-ui.js';

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
                ${this.renderCopyPaste()}
            </div>
        `;
        this.attachCommonListeners();
        this.attachCopyPasteListeners();
    }

    handleCopy() {
        const copyBtn = this.container.querySelector('#copy-props-btn');
        const payload = {
            type: 'model',
            props: {
                name: this.container.querySelector('#prop-name')?.value || ''
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
            pasteBtn.textContent = 'Pasted ✓';
            setTimeout(() => { if (pasteBtn) pasteBtn.textContent = 'Paste Properties' }, 900);
        } catch (e) {
            console.error('Paste failed', e);
            alert('Failed to paste properties');
        }
    }
}