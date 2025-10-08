export class BasePropertiesUI {
    constructor(mapObject, container, mapManager) {
        this.mapObject = mapObject;
        this.container = container;
        this.mapManager = mapManager;
        this.eventListeners = [];
    }

    render() {
        // To be implemented by subclasses
    }

    renderHeader(title) {
        return `<div class=\"panel-header\"><h2>${title}</h2></div>`;
    }

    renderNameInput() {
        return `
            <div class=\"property-group\">
                <label>Name</label>
                <input type=\"text\" id=\"prop-name\" value=\"${this.mapObject.name || this.mapObject.assetName}\" />
            </div>
        `;
    }

    renderPositionInput() {
        const pos = this.mapObject.position;
        return `
            <div class=\"property-group\">
                <label>Position</label>
                <div class=\"property-row\">
                    <input type=\"number\" id=\"prop-pos-x\" value=\"${pos.x.toFixed(2)}\" step=\"0.1\" />
                    <input type=\"number\" id=\"prop-pos-y\" value=\"${pos.y.toFixed(2)}\" step=\"0.1\" />
                    <input type=\"number\" id=\"prop-pos-z\" value=\"${pos.z.toFixed(2)}\" step=\"0.1\" />
                </div>
            </div>
        `;
    }

    renderRotationInput() {
        const rot = this.mapObject.rotation;
        return `
            <div class=\"property-group\">
                <label>Rotation (Degrees)</label>
                <div class=\"property-row\">
                    <input type=\"number\" id=\"prop-rot-x\" value=\"${(rot.x * 180 / Math.PI).toFixed(1)}\" step=\"1\" />
                    <input type=\"number\" id=\"prop-rot-y\" value=\"${(rot.y * 180 / Math.PI).toFixed(1)}\" step=\"1\" />
                    <input type=\"number\" id=\"prop-rot-z\" value=\"${(rot.z * 180 / Math.PI).toFixed(1)}\" step=\"1\" />
                </div>
            </div>
        `;
    }

    renderCopyPaste() {
        return `
            <div class=\"property-group\" style=\"display:flex;gap:8px;align-items:center;\">
                <button id=\"copy-props-btn\" class=\"cinematic-btn\">Copy Properties</button>
                <button id=\"paste-props-btn\" class=\"cinematic-btn\">Paste Properties</button>
            </div>
        `;
    }

    attachCommonListeners() {
        this.addListener('#prop-name', 'change', (e) => {
            this.mapManager.updateObjectProperties(this.mapObject, { name: e.target.value });
            if (this.mapObject.type === 'light') {
                this.mapObject.object.name = e.target.value;
            }
        });

        const obj = (this.mapObject.type === 'light' || this.mapObject.type === 'text' || this.mapObject.type === 'shape')
            ? this.mapObject.object.container : this.mapObject.object;

        ['x', 'y', 'z'].forEach(axis => {
            this.addListener(`#prop-pos-${axis}`, 'change', (e) => {
                obj.position[axis] = parseFloat(e.target.value);
                this.mapManager.updateObjectProperties(this.mapObject, {});
            });

            this.addListener(`#prop-rot-${axis}`, 'change', (e) => {
                obj.rotation[axis] = parseFloat(e.target.value) * Math.PI / 180;
                this.mapManager.updateObjectProperties(this.mapObject, {});
            });
        });
    }

    attachCopyPasteListeners() {
        this.addListener('#copy-props-btn', 'click', () => this.handleCopy());
        this.addListener('#paste-props-btn', 'click', () => this.handlePaste());
    }

    handleCopy() { /* subclass implementation */ }
    handlePaste() { /* subclass implementation */ }

    addListener(selector, event, handler) {
        const element = this.container.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        }
    }

    destroy() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
        this.container.innerHTML = '';
    }
}