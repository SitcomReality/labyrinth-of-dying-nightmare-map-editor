import { BasePropertiesUI } from './base-properties-ui.js';

export class ConnectorPropertiesUI extends BasePropertiesUI {
    constructor(mapObject, container, mapManager) {
        super(mapObject, container, mapManager);
        this.connectorObj = mapObject.object;
        this.config = this.connectorObj.config;
    }

    render() {
        this.container.innerHTML = `
            ${this.renderHeader('Connector Properties')}
            <div class="properties-content">
                ${this.renderNameInput()}
                ${this.renderPositionInput()}
                ${this.renderConnectorSpecificProperties()}
            </div>
        `;
        this.attachCommonListeners();
        this.attachConnectorListeners();
    }

    // Connectors don't need rotation input, direction is a dropdown
    renderRotationInput() { return ''; }

    renderConnectorSpecificProperties() {
        const directions = ['north', 'east', 'south', 'west'];
        return `
            <div class="property-group">
                <label>Direction</label>
                <select id="connector-direction" style="width:100%; padding:8px; background:#0a0a0a; border:1px solid #2a2a2a; color:#e0e0e0; border-radius:4px;">
                    ${directions.map(d => `<option value="${d}" ${this.config.direction === d ? 'selected' : ''}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`).join('')}
                </select>
            </div>
            <div class="property-group">
                <label>Connection Type</label>
                <input type="text" id="connector-type" value="${this.config.connectionType || 'corridor'}"/>
            </div>
            <div class="property-group property-color-group">
                <label for="connector-color">Color</label>
                <input type="color" id="connector-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
            </div>
        `;
    }

    attachConnectorListeners() {
        this.addListener('#connector-direction', 'change', (e) => {
            this.connectorObj.setDirection(e.target.value);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#connector-type', 'change', (e) => {
            this.connectorObj.setConnectionType(e.target.value);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });

        this.addListener('#connector-color', 'change', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.connectorObj.setColor(color);
            this.mapManager.updateObjectProperties(this.mapObject, {});
        });
    }
}