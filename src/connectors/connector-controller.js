export class ConnectorController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.connectors = [];
        this.editorMode = true;
        this.ghostConnector = null; // Track active ghost
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
            
            // Force remove from scene before disposal
            if (connectorObject.container && connectorObject.container.parent) {
                this.sceneManager.scene.remove(connectorObject.container);
            }
            
            connectorObject.dispose();
        }
    }

    setEditorMode(enabled) {
        this.editorMode = enabled;
        this.connectors.forEach(connector => {
            connector.setEditorVisibility(enabled);
        });
    }

    // New method to handle ghost lifecycle during placement
    setGhostConnector(ghost) {
        // Clean up existing ghost
        if (this.ghostConnector) {
            this.disposeGhostConnector();
        }
        this.ghostConnector = ghost;
    }

    disposeGhostConnector() {
        if (this.ghostConnector) {
            // Remove from scene first
            if (this.ghostConnector.container && this.ghostConnector.container.parent) {
                this.sceneManager.scene.remove(this.ghostConnector.container);
            }
            this.ghostConnector.dispose();
            this.ghostConnector = null;
        }
    }

    update(deltaTime) {
        this.connectors.forEach(connector => {
            connector.update(deltaTime);
        });
    }

    clear() {
        // Clean up ghost first
        this.disposeGhostConnector();
        
        // Clean up all connectors
        this.connectors.forEach(connector => {
            if (connector.container && connector.container.parent) {
                this.sceneManager.scene.remove(connector.container);
            }
            connector.dispose();
        });
        this.connectors = [];
    }
}