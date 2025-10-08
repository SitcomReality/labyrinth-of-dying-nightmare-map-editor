export class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressFill = document.getElementById('progress-fill');
        this.statusText = document.getElementById('loading-status');
        this.totalItems = 0;
        this.loadedItems = 0;
    }

    setTotalItems(total) {
        this.totalItems = total;
        this.loadedItems = 0;
    }

    updateProgress(loaded, total) {
        this.loadedItems = loaded;
        this.totalItems = total;
        const percent = (loaded / total) * 100;
        this.progressFill.style.width = `${percent}%`;
    }

    updateStatus(status) {
        this.statusText.textContent = status;
    }

    hide() {
        this.loadingScreen.style.opacity = '0';
        this.loadingScreen.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            // Trigger resize after app is visible to fix canvas dimensions
            window.dispatchEvent(new Event('resize'));
        }, 300);
    }
}