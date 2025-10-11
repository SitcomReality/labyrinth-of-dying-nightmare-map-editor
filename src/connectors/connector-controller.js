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

        // Cleanup any orphaned connector sprites that might have been left behind
        // (defensive sweep for phantom sprites not tracked in this.connectors).
        try {
            const toRemove = [];
            this.sceneManager.scene.traverse((node) => {
                if (node && node.userData && node.userData.isConnectorSprite) {
                    // If this sprite's parent is not one of our active connector containers, remove it
                    const parent = node.parent;
                    const isOwned = this.connectors.some(c => c.container === parent);
                    if (!isOwned) toRemove.push(node);
                }
            });
            toRemove.forEach(spr => {
                if (spr.parent) spr.parent.remove(spr);
                // dispose material/texture if present
                try {
                    if (spr.material?.map) spr.material.map.dispose();
                    if (spr.material) spr.material.dispose();
                } catch (e) { /* ignore disposal errors */ }
            });
        } catch (e) {
            console.warn('ConnectorController: cleanup sweep failed', e);
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

        // Also remove any stray connector sprites left anywhere in the scene
        try {
            const toRemove = [];
            this.sceneManager.scene.traverse((node) => {
                if (node && node.userData && node.userData.isConnectorSprite) {
                    toRemove.push(node);
                }
            });
            toRemove.forEach(spr => {
                if (spr.parent) spr.parent.remove(spr);
                try {
                    if (spr.material?.map) spr.material.map.dispose();
                    if (spr.material) spr.material.dispose();
                } catch (e) { /* ignore */ }
            });
        } catch (e) {
            console.warn('ConnectorController: clear cleanup failed', e);
        }
    }
}