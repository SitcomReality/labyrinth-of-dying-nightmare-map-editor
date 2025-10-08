export class InputManager {
    constructor(container) {
        this.container = container;
        this.listeners = {};
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => this.emit('keydown', e));
        window.addEventListener('keyup', (e) => this.emit('keyup', e));
        
        this.container.addEventListener('mousemove', (e) => this.emit('mousemove', e));
        this.container.addEventListener('mousedown', (e) => this.emit('mousedown', e));
        this.container.addEventListener('mouseup', (e) => this.emit('mouseup', e));
        this.container.addEventListener('wheel', (e) => this.emit('wheel', e));
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}