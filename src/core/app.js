import { SceneManager } from '../scene/scene-manager.js';
import { CameraController } from '../camera/camera-controller.js';
import { CameraPresets } from '../camera/camera-presets.js';
import { InputManager } from '../input/input-manager.js';
import { ToolManager } from '../tools/tool-manager.js';
import { AssetManager } from '../assets/asset-manager.js';
import { UIManager } from '../ui/ui-manager.js';
import { HistoryManager } from '../history/history-manager.js';
import { MapManager } from '../map/map-manager.js';
import { MinimapUI } from '../ui/minimap-ui.js';
import { CameraControlsUI } from '../ui/camera-controls-ui.js';
import { SaveManager } from '../persistence/save-manager.js';
import { InputFocusManager } from '../input/input-focus-manager.js';
import { LightController } from '../lights/light-controller.js';
import { TextController } from '../text/text-controller.js';
import { ShapeController } from '../shapes/shape-controller.js';
import { EnvironmentPanelUI } from '../ui/environment-panel-ui.js';
import { ConnectorController } from '../connectors/connector-controller.js';
import { RotationPreviewManager } from '../preview/rotation-preview-manager.js';
import { NPCController } from '../npc/npc-controller.js';

export class App {
    constructor(loadingManager) {
        this.container = document.getElementById('canvas-container');
        this.loadingManager = loadingManager;
    }

    async initialize() {
        this.sceneManager = new SceneManager(this.container);
        this.inputFocusManager = new InputFocusManager();
        this.cameraController = new CameraController(this.sceneManager.camera, this.container, this.inputFocusManager);
        this.cameraPresets = new CameraPresets(this.cameraController);
        this.inputManager = new InputManager(this.container);
        this.assetManager = new AssetManager(this.sceneManager, this.loadingManager);
        this.mapManager = new MapManager(this.sceneManager);
        this.historyManager = new HistoryManager(this.mapManager, this.sceneManager, this.assetManager);
        this.mapManager.historyManager = this.historyManager;
        this.toolManager = new ToolManager(this.sceneManager, this.inputManager, this.mapManager, this.historyManager);
        this.lightController = new LightController(this.sceneManager);
        this.textController = new TextController(this.sceneManager);
        this.shapeController = new ShapeController(this.sceneManager);
        this.connectorController = new ConnectorController(this.sceneManager);
        this.saveManager = new SaveManager(this.mapManager, this.sceneManager, this.assetManager);
        this.rotationPreviewManager = new RotationPreviewManager(this.sceneManager, this.mapManager, this.cameraController);
        this.npcController = new NPCController(this.sceneManager);

        window.app = this;

        await this.assetManager.discoverAssets();

        this.uiManager = new UIManager(this, this.assetManager, this.toolManager, this.mapManager, this.historyManager, this.saveManager);
        this.minimap = new MinimapUI(this.sceneManager, this.cameraController, this.mapManager);
        this.cameraControlsUI = new CameraControlsUI(this.cameraController, this.cameraPresets);
        this.environmentPanel = this.uiManager.environmentPanel;

        {
            const bottom = document.getElementById('bottom-bar');
            if (bottom) {
                const camBtn = document.createElement('button');
                camBtn.id = 'show-camera-controls-btn';
                camBtn.className = 'tool-btn';
                camBtn.textContent = 'Camera';
                const envBtn = document.createElement('button');
                envBtn.id = 'show-environment-btn';
                envBtn.className = 'tool-btn';
                envBtn.textContent = 'Environment';
                bottom.appendChild(camBtn);
                bottom.appendChild(envBtn);

                camBtn.addEventListener('click', () => {
                    const panel = document.getElementById('camera-controls-panel');
                    if (panel) {
                        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                    }
                });
                envBtn.addEventListener('click', () => {
                    const panel = document.getElementById('environment-menu');
                    if (panel) {
                        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                    }
                });
            }
        }

        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        this.inputManager.on('keydown', (e) => {
            if (e.key === 'f' || e.key === 'F') {
                const selectedTool = this.toolManager.tools.select;
                if (selectedTool && selectedTool.selectedObject) {
                    this.cameraController.focusOnObject(selectedTool.selectedObject);
                }
            }
            if (e.key === 'g' || e.key === 'G') {
                if (!this.inputFocusManager.isTextInputFocused()) {
                    this.toolManager.setTool('pickup');
                }
            }
            this.cameraController.handleKeyDown(e);
            this.toolManager.handleKeyDown(e);
        });
        this.inputManager.on('keyup', (e) => {
            this.cameraController.handleKeyUp(e);
            this.toolManager.handleKeyUp(e);
        });
        this.inputManager.on('mousemove', (e) => this.handleMouseMove(e));
        this.inputManager.on('mousedown', (e) => this.handleMouseDown(e));
        this.inputManager.on('mouseup', (e) => this.handleMouseUp(e));
        this.inputManager.on('wheel', (e) => this.handleWheel(e));

        window.addEventListener('resize', () => this.handleResize());

        window.addEventListener('toggleOrthographic', () => {
            this.cameraController.toggleOrthographic(this.sceneManager);
        });

        window.addEventListener('toggleRotationPreview', (e) => {
            const { isActive } = e.detail;
            this.rotationPreviewManager.toggle(isActive);
        });
    }

    handleMouseMove(event) {
        if (this.rotationPreviewManager.isActive) return;
        if (!this.cameraController.isOrthographic) {
            this.cameraController.handleMouseMove(event);
        }
        this.toolManager.handleMouseMove(event);
    }

    handleMouseDown(event) {
        if (this.rotationPreviewManager.isActive) return;
        if (!this.cameraController.isOrthographic) {
            this.cameraController.handleMouseDown(event);
        }
        this.toolManager.handleMouseDown(event);
    }

    handleMouseUp(event) {
        if (this.rotationPreviewManager.isActive) return;
        if (!this.cameraController.isOrthographic) {
            this.cameraController.handleMouseUp(event);
        }
        this.toolManager.handleMouseUp(event);
    }

    handleWheel(event) {
        if (this.rotationPreviewManager.isActive) {
            this.cameraController.handleWheel(event);
            return;
        }
        if (this.toolManager.currentTool && typeof this.toolManager.currentTool.handleWheel === 'function') {
            this.toolManager.handleWheel(event);
        } else {
            this.cameraController.handleWheel(event);
        }
    }

    handleResize() {
        this.sceneManager.handleResize();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016;

        this.cameraController.update();
        this.toolManager.update();
        this.minimap.update();
        this.lightController.update(deltaTime);
        this.textController.update(deltaTime);
        this.shapeController.update(deltaTime);
        this.connectorController.update(deltaTime);
        this.npcController.update(deltaTime);
        this.sceneManager.render();
    }
}