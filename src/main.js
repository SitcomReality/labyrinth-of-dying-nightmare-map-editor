import { LoadingManager } from './core/loading-manager.js';
import { App } from './core/app.js';

const loadingManager = new LoadingManager();

async function main() {
    const app = new App(loadingManager);
    await app.initialize();
    // Expose app for InputFocusManager registration in UI modules
    window.app = app;

    loadingManager.hide();
}

main();