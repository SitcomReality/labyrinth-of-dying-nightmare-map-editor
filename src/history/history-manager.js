export class HistoryManager {
    constructor(mapManager, sceneManager, assetManager) {
        this.mapManager = mapManager;
        this.sceneManager = sceneManager;
        this.assetManager = assetManager;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50;
    }

    recordAction(type, data) {
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        this.history.push({ type, data, timestamp: Date.now() });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
        
        window.dispatchEvent(new CustomEvent('historyChanged'));
    }

    undo() {
        if (this.currentIndex >= 0) {
            const action = this.history[this.currentIndex];
            this.executeUndo(action);
            this.currentIndex--;
            window.dispatchEvent(new CustomEvent('historyChanged'));
        }
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            const action = this.history[this.currentIndex];
            this.executeRedo(action);
            window.dispatchEvent(new CustomEvent('historyChanged'));
        }
    }

    executeUndo(action) {
        switch (action.type) {
            case 'place':
                this.mapManager.removeObject(action.data.mapObject.object);
                break;
            case 'delete':
                const clone = this.assetManager.cloneAsset(action.data.mapObject.assetName);
                if (clone) {
                    clone.position.copy(action.data.mapObject.position);
                    clone.rotation.copy(action.data.mapObject.rotation);
                    this.mapManager.addObjectDirect({
                        ...action.data.mapObject,
                        object: clone
                    });
                }
                break;
            case 'rotate':
                if (action.data.mapObject && action.data.mapObject.object) {
                    action.data.mapObject.object.rotation.x = action.data.oldRotation.x;
                    action.data.mapObject.object.rotation.y = action.data.oldRotation.y;
                    action.data.mapObject.object.rotation.z = action.data.oldRotation.z;
                    action.data.mapObject.rotation.x = action.data.oldRotation.x;
                    action.data.mapObject.rotation.y = action.data.oldRotation.y;
                    action.data.mapObject.rotation.z = action.data.oldRotation.z;
                }
                break;
        }
    }

    executeRedo(action) {
        switch (action.type) {
            case 'place':
                const clone = this.assetManager.cloneAsset(action.data.mapObject.assetName);
                if (clone) {
                    clone.position.copy(action.data.mapObject.position);
                    clone.rotation.copy(action.data.mapObject.rotation);
                    this.mapManager.addObjectDirect({
                        ...action.data.mapObject,
                        object: clone
                    });
                }
                break;
            case 'delete':
                this.mapManager.removeObject(action.data.mapObject.object);
                break;
            case 'rotate':
                if (action.data.mapObject && action.data.mapObject.object) {
                    action.data.mapObject.object.rotation.x = action.data.newRotation.x;
                    action.data.mapObject.object.rotation.y = action.data.newRotation.y;
                    action.data.mapObject.object.rotation.z = action.data.newRotation.z;
                    action.data.mapObject.rotation.x = action.data.newRotation.x;
                    action.data.mapObject.rotation.y = action.data.newRotation.y;
                    action.data.mapObject.rotation.z = action.data.newRotation.z;
                }
                break;
        }
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
}