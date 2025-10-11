export class ConnectorController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.connectors = [];
        this.editorMode = true;
    }

    addConnector(connectorObject) {
        this.connectors.push(connectorObject);
        this.sceneManager.scene.add(connectorObject.container);
        connectorObject.setEditorVisibility(this.editorMode);
        return connectorObject;
    }

    removeConnector(connectorObject) {
        const index = this.connectors.indexOf(connectorObject);
        if (index > -1) {
            this.connectors.splice(index, 1);
            this.sceneManager.scene.remove(connectorObject.container);
            connectorObject.dispose();
        }
    }

    setEditorMode(enabled) {
        this.editorMode = enabled;
        this.connectors.forEach(connector => {
            connector.setEditorVisibility(enabled);
        });
    }

    update(deltaTime) {
        this.connectors.forEach(connector => {
            connector.update(deltaTime);
        });
    }

    clear() {
        this.connectors.forEach(connector => {
            this.sceneManager.scene.remove(connector.container);
            connector.dispose();
        });
        this.connectors = [];
    }
}