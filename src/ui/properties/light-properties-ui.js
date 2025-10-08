import { BasePropertiesUI } from './base-properties-ui.js';

export class LightPropertiesUI extends BasePropertiesUI {
    constructor(mapObject, container, mapManager) {
        super(mapObject, container, mapManager);
        this.lightObj = mapObject.object;
        this.config = this.lightObj.config;
    }

    render() {
        this.container.innerHTML = `
            ${this.renderHeader('Light Properties')}
            <div class="properties-content">
                ${this.renderNameInput()}
                ${this.renderPositionInput()}
                ${this.renderLightSpecificProperties()}
                ${this.renderCopyPaste()}
            </div>
        `;
        this.attachCommonListeners();
        this.attachLightListeners();
        this.attachCopyPasteListeners();
    }

    renderLightSpecificProperties() {
        return `
            <div class="property-group property-color-group">
                <label for="light-color">Color</label>
                <input type="color" id="light-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
            </div>
            <div class="property-group">
                <label>Intensity</label>
                <input type="number" id="light-intensity" value="${this.config.intensity}" min="0" max="10" step="0.1"/>
            </div>
            ${this.config.type === 'point' ? `
            <div class="property-group">
                <label>Distance</label>
                <input type="number" id="light-distance" value="${this.config.distance}" min="1" max="100" step="1"/>
            </div>
            <div class="property-group">
                <label>Decay</label>
                <input type="number" id="light-decay" value="${this.config.decay}" min="0" max="10" step="0.1"/>
            </div>
            ` : ''}
            <div class="property-group">
                <label>Lighting Effect</label>
                <select id="light-effect" style="width:100%; padding:8px; background:#0a0a0a; border:1px solid #2a2a2a; color:#e0e0e0; border-radius:4px;">
                    <option value="none" ${this.lightObj.effectType==='none' ? 'selected' : ''}>None</option>
                    <option value="flicker" ${this.lightObj.effectType==='flicker' ? 'selected' : ''}>Flicker (legacy)</option>
                    <option value="pulse" ${this.lightObj.effectType==='pulse' ? 'selected' : ''}>Pulse</option>
                    <option value="strobe" ${this.lightObj.effectType==='strobe' ? 'selected' : ''}>Strobe</option>
                    <option value="noise" ${this.lightObj.effectType==='noise' ? 'selected' : ''}>Noise</option>
                </select>
            </div>
            <div class="property-group" id="effect-controls" style="display:${this.lightObj.effectType==='none' ? 'none' : 'block'}">
                <label>Effect Speed</label>
                <input type="number" id="light-effect-speed" value="${(this.lightObj.effectSpeed ?? this.lightObj.flickerSpeed ?? 0.1)}" min="0" max="5" step="0.01"/>
                <label>Effect Intensity</label>
                <input type="number" id="light-effect-intensity" value="${(this.lightObj.effectIntensity ?? this.lightObj.flickerIntensity ?? 0.3)}" min="0" max="2" step="0.01"/>
            </div>
        `;
    }

    attachLightListeners() {
        this.addListener('#light-color', 'change', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.lightObj.setColor(color);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-intensity', 'input', (e) => {
            this.lightObj.setIntensity(parseFloat(e.target.value));
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-distance', 'input', (e) => {
            this.lightObj.setDistance(parseFloat(e.target.value));
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-decay', 'input', (e) => {
            this.lightObj.setDecay(parseFloat(e.target.value));
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-effect', 'change', (e) => {
            const v = e.target.value;
            const speed = parseFloat(this.container.querySelector('#light-effect-speed')?.value) || 0.1;
            const intensity = parseFloat(this.container.querySelector('#light-effect-intensity')?.value) || 0.3;
            this.lightObj.setEffect(v, speed, intensity);
            // Toggle effect controls visibility
            const controls = this.container.querySelector('#effect-controls');
            if (controls) controls.style.display = (v === 'none') ? 'none' : 'block';
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-effect-speed', 'input', (e) => {
            const speed = parseFloat(e.target.value);
            const intensity = parseFloat(this.container.querySelector('#light-effect-intensity')?.value) || 0.3;
            this.lightObj.setEffect(this.container.querySelector('#light-effect')?.value || 'none', speed, intensity);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-effect-intensity', 'input', (e) => {
            const intensity = parseFloat(e.target.value);
            const speed = parseFloat(this.container.querySelector('#light-effect-speed')?.value) || 0.1;
            this.lightObj.setEffect(this.container.querySelector('#light-effect')?.value || 'none', speed, intensity);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#light-flickering', 'change', (e) => {
            // legacy checkbox still supported but hidden in new UI; keep for backward compatibility if present
            const enabled = e.target.checked;
            const speed = parseFloat(this.container.querySelector('#light-effect-speed')?.value) || 0.1;
            const intensity = parseFloat(this.container.querySelector('#light-effect-intensity')?.value) || 0.3;
            if (enabled) this.lightObj.setEffect('flicker', speed, intensity);
            else this.lightObj.setEffect('none', 0, 0);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#flicker-speed', 'input', (e) => {
            // keep legacy input wired for compatibility: mirror into new effect
            const speed = parseFloat(e.target.value);
            const intensity = parseFloat(this.container.querySelector('#flicker-intensity')?.value) || 0.3;
            this.lightObj.setEffect(this.container.querySelector('#light-effect')?.value || 'flicker', speed, intensity);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#flicker-intensity', 'input', (e) => {
            const intensity = parseFloat(e.target.value);
            const speed = parseFloat(this.container.querySelector('#flicker-speed')?.value) || 0.1;
            this.lightObj.setEffect(this.container.querySelector('#light-effect')?.value || 'flicker', speed, intensity);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });
    }

    handleCopy() {
        const copyBtn = this.container.querySelector('#copy-props-btn');
        const payload = {
            type: 'light',
            props: {
                config: { ...this.lightObj.config },
                flickering: this.lightObj.flickering,
                flickerSpeed: this.lightObj.flickerSpeed,
                flickerIntensity: this.lightObj.flickerIntensity,
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
            if (data.type !== 'light') { /* allow but warn? */ }
            const p = data.props || {};

            if (p.config) {
                if (p.config.color !== undefined) this.lightObj.setColor(p.config.color);
                if (p.config.intensity !== undefined) this.lightObj.setIntensity(p.config.intensity);
                if (p.config.distance !== undefined) this.lightObj.setDistance(p.config.distance);
                if (p.config.decay !== undefined) this.lightObj.setDecay(p.config.decay);
            }

            if (p.flickering !== undefined) {
                this.lightObj.setFlickering(p.flickering, p.flickerSpeed ?? 0.1, p.flickerIntensity ?? 0.3);
            }

            if (p.name !== undefined) {
                this.mapObject.name = p.name;
                this.lightObj.name = p.name;
            }

            this.mapManager.updateObjectProperties(this.mapObject, {});
            this.render(); // Re-render to show updated values in UI

            // Re-select paste button and show confirmation
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