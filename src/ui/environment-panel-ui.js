const radToDeg = (rad) => rad * 180 / Math.PI;
const degToRad = (deg) => deg * Math.PI / 180;

export class EnvironmentPanelUI {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.container = null;
        this.create();
    }

    create() {
        // Avoid creating multiple panels
        if (document.getElementById('environment-menu')) return;

        this.container = document.createElement('div');
        this.container.id = 'environment-menu';
        this.container.className = 'environment-panel';
        this.container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <h3 style="margin:0;font-size:14px;">Environment</h3>
                <button id="close-env-menu" style="background:none;border:none;color:#888;font-size:18px;cursor:pointer;">&times;</button>
            </div>
            <div class="environment-controls">
                <div class="env-control property-color-group">
                    <label>Ambient Color</label>
                    <input type="color" id="ambient-color" value="#ffffff" />
                </div>
                <div class="env-control">
                    <label>Ambient Light</label>
                    <input type="range" id="ambient-light" min="0" max="1" step="0.1" value="0.4" />
                </div>
                <div class="env-control property-color-group">
                    <label>Directional Color</label>
                    <input type="color" id="directional-color" value="#ffffff" />
                </div>
                <div class="env-control">
                    <label>Directional Light</label>
                    <input type="range" id="directional-light" min="0" max="2" step="0.1" value="0.8" />
                </div>
                <div class="env-control">
                    <label>Dir Light Pitch (X)</label>
                    <input type="range" id="directional-rot-x" min="-180" max="180" step="1" value="-57" />
                </div>
                <div class="env-control">
                    <label>Dir Light Yaw (Y)</label>
                    <input type="range" id="directional-rot-y" min="-180" max="180" step="1" value="0" />
                </div>
                <div class="env-control property-color-group">
                    <label>Void/Background Color</label>
                    <input type="color" id="background-color" value="#1a1a1a" />
                </div>
                <div class="env-control property-color-group">
                    <label>Fog Color</label>
                    <input type="color" id="fog-color" value="#1a1a1a" />
                </div>
                <div class="env-control">
                    <label>Fog Density</label>
                    <input type="range" id="fog-density" min="0" max="0.1" step="0.005" value="0" />
                </div>
            </div>
        `;
        document.body.appendChild(this.container);
        this.addStyles();
        this.loadInitialState();
        this.attachEventListeners();
    }
    
    loadInitialState() {
        const state = this.sceneManager.getEnvironmentState();
        
        // Update range inputs
        document.getElementById('ambient-light').value = state.ambientLight;
        document.getElementById('directional-light').value = state.directionalLight;
        document.getElementById('fog-density').value = state.fogDensity;
        
        // Update color inputs
        document.getElementById('ambient-color').value = '#' + state.ambientColor.toString(16).padStart(6, '0');
        document.getElementById('directional-color').value = '#' + state.directionalColor.toString(16).padStart(6, '0');
        document.getElementById('background-color').value = '#' + state.backgroundColor.toString(16).padStart(6, '0');
        document.getElementById('fog-color').value = '#' + state.fogColor.toString(16).padStart(6, '0');
        
        // Update rotation inputs (convert radians to degrees)
        document.getElementById('directional-rot-x').value = radToDeg(state.directionalRotationX).toFixed(0);
        document.getElementById('directional-rot-y').value = radToDeg(state.directionalRotationY).toFixed(0);
    }

    attachEventListeners() {
        document.getElementById('close-env-menu')?.addEventListener('click', () => {
            this.container.style.display = 'none';
        });

        const ambientLightEl = document.getElementById('ambient-light');
        ambientLightEl?.addEventListener('input', (e) => {
            this.sceneManager.setAmbientLightIntensity(parseFloat(e.target.value));
        });

        document.getElementById('ambient-color')?.addEventListener('input', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.sceneManager.setAmbientLightColor(color);
        });

        const directionalLightEl = document.getElementById('directional-light');
        directionalLightEl?.addEventListener('input', (e) => {
            this.sceneManager.setDirectionalLightIntensity(parseFloat(e.target.value));
        });

        document.getElementById('directional-color')?.addEventListener('input', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.sceneManager.setDirectionalLightColor(color);
        });
        
        document.getElementById('directional-rot-x')?.addEventListener('input', (e) => {
            const rotX = degToRad(parseFloat(e.target.value));
            const rotY = degToRad(parseFloat(document.getElementById('directional-rot-y').value));
            this.sceneManager.setDirectionalLightRotation(rotX, rotY);
        });
        
        document.getElementById('directional-rot-y')?.addEventListener('input', (e) => {
            const rotY = degToRad(parseFloat(e.target.value));
            const rotX = degToRad(parseFloat(document.getElementById('directional-rot-x').value));
            this.sceneManager.setDirectionalLightRotation(rotX, rotY);
        });

        document.getElementById('background-color')?.addEventListener('input', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.sceneManager.setSceneBackgroundColor(color);
        });

        document.getElementById('fog-color')?.addEventListener('input', (e) => {
            const color = parseInt(e.target.value.substring(1), 16);
            this.sceneManager.setFogColor(color);
        });

        document.getElementById('fog-density')?.addEventListener('input', (e) => {
            this.sceneManager.setFogDensity(parseFloat(e.target.value));
        });
    }

    addStyles() {
        if (document.getElementById('environment-panel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'environment-panel-styles';
        style.textContent = `
            /* Environment panel base */
            .environment-panel {
                position: fixed;
                bottom: 64px;
                left: 20px;
                width: 300px; /* fixed width as requested */
                background: #141414;
                border: 1px solid #2a2a2a;
                border-radius: 8px;
                padding: 12px;
                z-index: 1000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                box-sizing: border-box;
            }
            /* Layout the environment controls vertically so they fit the panel width */
            .environment-panel .environment-controls {
                display: flex;
                flex-direction: column;
                gap: 12px;
                align-items: stretch;
            }

            .environment-panel .env-control {
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: space-between;
            }

            .environment-panel .env-control label {
                font-size: 12px;
                color: #888;
                white-space: nowrap;
                min-width: 90px;
                margin-right: 8px;
            }

            /* Make sliders expand to take available space within the panel */
            .environment-panel .env-control input[type="range"] {
                flex: 1;
                height: 4px;
                background: #2a2a2a;
                border-radius: 2px;
                outline: none;
                -webkit-appearance: none;
            }

            .environment-panel .env-control input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 12px;
                height: 12px;
                background: #4a9eff;
                border-radius: 50%;
                cursor: pointer;
            }

            .environment-panel .env-control input[type="range"]::-moz-range-thumb {
                width: 12px;
                height: 12px;
                background: #4a9eff;
                border-radius: 50%;
                border: none;
                cursor: pointer;
            }
            
            /* Styles for color inputs in .env-control */
            .environment-panel .env-control.property-color-group {
                justify-content: space-between;
            }
            
            .environment-panel .env-control input[type="color"] {
                -webkit-appearance: none; 
                appearance: none; 
                border: none; 
                width: 32px; 
                height: 32px; 
                padding: 0; 
                border-radius: 4px; 
                background: transparent; 
                cursor: pointer; 
                vertical-align: middle; 
                flex-shrink: 0; 
            }
            .environment-panel .env-control input[type="color"]::-webkit-color-swatch-wrapper { 
                padding: 0; 
            }
            .environment-panel .env-control input[type="color"]::-webkit-color-swatch { 
                border: 1px solid #2a2a2a; 
                border-radius: 3px; 
            }
        `;
        document.head.appendChild(style);
    }
}