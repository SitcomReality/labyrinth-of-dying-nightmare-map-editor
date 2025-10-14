export class TextController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.texts = [];
        this.editorMode = true;
    }

    addText(textObject) {
        this.texts.push(textObject);
        this.sceneManager.scene.add(textObject.container);
        textObject.setEditorVisibility(this.editorMode);
        return textObject;
    }

    removeText(textObject) {
        const index = this.texts.indexOf(textObject);
        if (index > -1) {
            this.texts.splice(index, 1);
            this.sceneManager.scene.remove(textObject.container);
            textObject.dispose();
        }
    }

    setEditorMode(enabled) {
        this.editorMode = enabled;
        this.texts.forEach(text => {
            text.setEditorVisibility(enabled);
        });
    }

    update(deltaTime) {
        this.texts.forEach(text => {
            text.update(deltaTime);
        });
    }

    clear() {
        this.texts.forEach(text => {
            this.sceneManager.scene.remove(text.container);
            text.dispose();
        });
        this.texts = [];
    }
}