export class CameraControlsUI {
    constructor(cameraController, cameraPresets) {
        this.cameraController = cameraController;
        this.cameraPresets = cameraPresets;
        this.container = null;
        this.isExpanded = false;
        this.create();
        this.setupEventListeners();
    }

    create() {
        // Create camera controls panel (all camera options live here)
        // Create expanded panel (hidden by default)
        this.container = document.createElement('div');
        this.container.id = 'camera-controls-panel';
        this.container.style.cssText = `
            position: fixed;
            bottom: 64px;
            right: 20px;
            width: 280px;
            background: #141414;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            padding: 16px;
            display: block;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 14px;">Camera Controls</h3>
                <button id="close-camera-panel" style="background: none; border: none; color: #888; font-size: 20px; cursor: pointer;">&times;</button>
            </div>
            <div class="camera-control-group">
                <label>Speed</label>
                <div style="display:flex;align-items:center;gap:8px;">
                    <input type="range" id="camera-speed-panel" min="0.1" max="2" step="0.1" value="0.5" />
                    <span id="camera-speed-value-panel" style="color:#4a9eff;">0.5</span>
                </div>
            </div>
            <div class="camera-control-group" style="display:flex;gap:8px;">
                <button id="toggle-ortho-panel" class="camera-btn">Toggle Ortho</button>
                <button id="show-light-helpers-panel" class="camera-btn">💡 Radius</button>
                <button id="reset-camera" class="camera-btn">Reset View</button>
            </div>
            <div class="camera-control-group">
                <label>Presets</label>
                <div id="preset-list"></div>
                <button id="save-preset" class="camera-btn">Save Preset</button>
            </div>
        `;

        document.body.appendChild(this.container);
        this.updatePresetList();
        this.addStyles();
    }

    setupEventListeners() {
        document.getElementById('camera-speed-panel')?.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.cameraController.setSpeed(speed);
            document.getElementById('camera-speed-value-panel').textContent = speed.toFixed(1);
        });

        document.getElementById('toggle-ortho-panel')?.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('toggleOrthographic'));
        });

        document.getElementById('show-light-helpers-panel')?.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            const showHelpers = e.currentTarget.classList.contains('active');
            window.app?.lightController?.lights.forEach(light => {
                light.setHelperVisibility(showHelpers);
            });
        });

        this.isExpanded = true;

        document.getElementById('close-camera-panel')?.addEventListener('click', () => {
            this.isExpanded = false;
            this.container.style.display = 'none';
        });

        document.getElementById('reset-camera')?.addEventListener('click', () => {
            this.cameraController.camera.position.set(10, 15, 10);
            this.cameraController.rotation = { x: -Math.PI / 4, y: 0 };
        });

        document.getElementById('save-preset')?.addEventListener('click', () => {
            const name = prompt('Enter preset name:');
            if (name) {
                this.cameraPresets.savePreset(name);
            }
        });

        window.addEventListener('cameraSpeedChanged', (e) => {
            const slider = document.getElementById('camera-speed-panel');
            if (slider) {
                slider.value = e.detail.speed;
                document.getElementById('camera-speed-value-panel').textContent = e.detail.speed.toFixed(1);
            }
        });

        window.addEventListener('cameraPresetsChanged', () => {
            this.updatePresetList();
        });
    }

    updatePresetList() {
        const listContainer = document.getElementById('preset-list');
        if (!listContainer) return;

        const presets = this.cameraPresets.getAllPresets();

        if (presets.length === 0) {
            listContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: #666; font-size: 12px;">No saved presets</div>';
            return;
        }

        listContainer.innerHTML = presets.map(name => `
            <div class="preset-item">
                <button class="preset-load" data-preset="${name}">${name}</button>
                <button class="preset-delete" data-preset="${name}">×</button>
            </div>
        `).join('');

        listContainer.querySelectorAll('.preset-load').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cameraPresets.loadPreset(btn.dataset.preset);
            });
        });

        listContainer.querySelectorAll('.preset-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm(`Delete preset "${btn.dataset.preset}"?`)) {
                    this.cameraPresets.deletePreset(btn.dataset.preset);
                }
            });
        });
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .camera-control-group {
                margin-bottom: 16px;
            }

            .camera-control-group label {
                display: block;
                font-size: 12px;
                color: #888;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .camera-btn {
                width: 100%;
                padding: 8px;
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                color: #e0e0e0;
                cursor: pointer;
                font-size: 12px;
                border-radius: 4px;
                margin-bottom: 4px;
                transition: all 0.15s ease;
            }

            .camera-btn:hover {
                background: #2a2a2a;
                border-color: #4a9eff;
            }

            #preset-list {
                margin-bottom: 8px;
            }

            .preset-item {
                display: flex;
                gap: 4px;
                margin-bottom: 4px;
            }

            .preset-load {
                flex: 1;
                padding: 6px;
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                color: #e0e0e0;
                cursor: pointer;
                font-size: 12px;
                border-radius: 4px;
                text-align: left;
            }

            .preset-load:hover {
                background: #2a2a2a;
                border-color: #4a9eff;
            }

            .preset-delete {
                width: 28px;
                padding: 6px;
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                color: #ff4a4a;
                cursor: pointer;
                font-size: 16px;
                border-radius: 4px;
            }

            .preset-delete:hover {
                background: #ff4a4a;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }
}