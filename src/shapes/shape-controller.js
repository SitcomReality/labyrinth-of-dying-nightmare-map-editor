export class ShapeController {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.shapes = [];
        this.editorMode = true;
    }

    addShape(shapeObject) {
        this.shapes.push(shapeObject);
        this.sceneManager.scene.add(shapeObject.container);
        shapeObject.setEditorVisibility(this.editorMode);
        return shapeObject;
    }

    removeShape(shapeObject) {
        const index = this.shapes.indexOf(shapeObject);
        if (index > -1) {
            this.shapes.splice(index, 1);
            this.sceneManager.scene.remove(shapeObject.container);
            shapeObject.dispose();
        }
    }

    setEditorMode(enabled) {
        this.editorMode = enabled;
        this.shapes.forEach(shape => {
            shape.setEditorVisibility(enabled);
        });
    }

    update(deltaTime) {
        this.shapes.forEach(shape => {
            shape.update(deltaTime);
        });
    }

    clear() {
        this.shapes.forEach(shape => {
            this.sceneManager.scene.remove(shape.container);
            shape.dispose();
        });
        this.shapes = [];
    }
}