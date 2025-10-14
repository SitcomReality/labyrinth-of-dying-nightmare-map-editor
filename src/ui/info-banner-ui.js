export class InfoBannerUI {
    constructor() {
        this.container = document.getElementById('info-banner-container');
        this.bannerElement = null;
        this.messages = [
            {
                id: 'webgem',
                html: 'Check out <a href="https://websim.com/@SitcomReality/webgem" target="_blank">WebGem</a> for Websim\'s highest quality overlooked projects!'
            },
            {
                id: 'kaylousberg',
                html: 'Models from <a href="https://kaylousberg.itch.io/" target="_blank">KayLousberg.itch.io</a>'
            },
            {
                id: 'sitcomreality',
                html: 'Vibecoded by <a href="https://websim.com/@SitcomReality" target="_blank">SitcomReality</a>'
            },
            {
                id: 'surface-snap',
                html: 'Hold <strong>CTRL</strong> when placing objects to snap to the surface of other objects (e.g. use for wall decorations).'
            },
            {
                id: 'placement-height',
                html: '<strong>Tip:</strong> Hold <strong>SHIFT</strong> and use the mouse wheel while placing an object to adjust its height (one grid unit per notch).'
            },
            {
                id: 'placement-rotate',
                html: '<strong>Tip:</strong> Click and drag to rotate an object while placing it.'
            },
            {
                id: 'camera-speed',
                html: '<strong>Tip:</strong> Use the <strong>+</strong> and <strong>-</strong> keys to adjust camera movement speed.'
            },
            {
                id: 'camera-focus',
                html: '<strong>Tip:</strong> Select an object and press <strong>F</strong> to focus the camera on it.'
            },
            {
                id: 'paint-mode',
                html: '<strong>Tip:</strong> Hold <strong>SHIFT</strong> while clicking to place multiple copies of an asset (Paint Mode).'
            },
            {
                id: 'asset-search',
                html: '<strong>Tip:</strong> Press <strong>/</strong> to quickly search for assets in the asset panel.'
            },
            {
                id: 'camera-presets',
                html: '<strong>Tip:</strong> Save and load camera positions using the ⚙️ icon in the bottom right.'
            },
            {
                id: 'undo-redo',
                html: '<strong>Tip:</strong> Use <strong>Ctrl+Z</strong> to Undo and <strong>Ctrl+Shift+Z</strong> to Redo your actions.'
            }
        ];
        this.dismissedMessages = this.getDismissedMessages();
        this.showTimeout = null;
        this.hideTimeout = null;
        this.cycleTimeout = null;

        this.init();
    }

    init() {
        this.addStyles();
        this.scheduleNextMessage();
    }

    getDismissedMessages() {
        try {
            const dismissed = sessionStorage.getItem('dismissedBanners');
            return dismissed ? JSON.parse(dismissed) : [];
        } catch (e) {
            return [];
        }
    }

    addDismissedMessage(id) {
        if (!this.dismissedMessages.includes(id)) {
            this.dismissedMessages.push(id);
            try {
                sessionStorage.setItem('dismissedBanners', JSON.stringify(this.dismissedMessages));
            } catch (e) {
                console.error("Could not save dismissed banners to session storage.", e);
            }
        }
    }

    getAvailableMessages() {
        return this.messages.filter(msg => !this.dismissedMessages.includes(msg.id));
    }

    scheduleNextMessage() {
        this.clearAllTimeouts();
        const availableMessages = this.getAvailableMessages();
        if (availableMessages.length === 0) {
            return;
        }

        this.cycleTimeout = setTimeout(() => {
            this.showMessage();
        }, 60000);
    }

    showMessage() {
        this.clearAllTimeouts();
        const availableMessages = this.getAvailableMessages();
        if (availableMessages.length === 0) {
            this.hideBanner();
            return;
        }

        const message = availableMessages[Math.floor(Math.random() * availableMessages.length)];

        if (this.bannerElement) {
            this.bannerElement.remove();
        }

        this.bannerElement = document.createElement('div');
        this.bannerElement.className = 'info-banner';
        this.bannerElement.innerHTML = `
            <span class="info-banner-text">${message.html}</span>
            <button class="info-banner-close" title="Dismiss message">&times;</button>
        `;
        this.container.appendChild(this.bannerElement);

        this.bannerElement.querySelector('.info-banner-close').addEventListener('click', () => {
            this.addDismissedMessage(message.id);
            this.hideBanner(true);
        });

        this.showTimeout = setTimeout(() => {
            this.bannerElement.classList.add('visible');
        }, 100);

        this.hideTimeout = setTimeout(() => {
            this.hideBanner();
        }, 8000);
    }

    hideBanner(isDismissal = false) {
        this.clearAllTimeouts();
        if (this.bannerElement) {
            this.bannerElement.classList.remove('visible');
            this.hideTimeout = setTimeout(() => {
                if (this.bannerElement) {
                    this.bannerElement.remove();
                    this.bannerElement = null;
                }
                this.scheduleNextMessage();
            }, 500);
        } else if (isDismissal) {
            this.scheduleNextMessage();
        }
    }

    clearAllTimeouts() {
        clearTimeout(this.showTimeout);
        clearTimeout(this.hideTimeout);
        clearTimeout(this.cycleTimeout);
    }

    addStyles() {
        if (document.getElementById('info-banner-styles')) return;
        const style = document.createElement('style');
        style.id = 'info-banner-styles';
        style.textContent = `
            #info-banner-container {
                position: relative;
                z-index: 100;
                height: 0;
            }
            .info-banner {
                background: #1f1f1f;
                color: #e0e0e0;
                padding: 8px 16px;
                text-align: center;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: translateY(-100%);
                opacity: 0;
                transition: transform 0.5s ease-out, opacity 0.5s ease-out;
                position: absolute;
                width: 100%;
                border-bottom: 1px solid #2a2a2a;
            }
            .info-banner.visible {
                transform: translateY(0);
                opacity: 1;
            }
            .info-banner-text a {
                color: #4a9eff;
                text-decoration: none;
                font-weight: 500;
            }
            .info-banner-text a:hover {
                text-decoration: underline;
            }
            .info-banner-close {
                background: none;
                border: none;
                color: #888;
                font-size: 20px;
                cursor: pointer;
                margin-left: 16px;
                padding: 0 8px;
                line-height: 1;
            }
            .info-banner-close:hover {
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }
}