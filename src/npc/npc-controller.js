export class NPCController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.npcs = [];
        this.editorMode = true;
    }
    addNPC(npcObject) {
        this.npcs.push(npcObject);
        this.sceneManager.scene.add(npcObject.container);
        npcObject.setEditorVisibility(this.editorMode);
        return npcObject;
    }
    removeNPC(npcObject) {
        const i = this.npcs.indexOf(npcObject);
        if (i > -1) {
            this.npcs.splice(i,1);
            this.sceneManager.scene.remove(npcObject.container);
            npcObject.dispose();
        }
    }
    setEditorMode(enabled) {
        this.editorMode = enabled;
        this.npcs.forEach(n => n.setEditorVisibility(enabled));
    }
    update(deltaTime) { this.npcs.forEach(n => n.update(deltaTime)); }
    clear() {
        this.npcs.forEach(n => { this.sceneManager.scene.remove(n.container); n.dispose(); });
        this.npcs = [];
    }
}