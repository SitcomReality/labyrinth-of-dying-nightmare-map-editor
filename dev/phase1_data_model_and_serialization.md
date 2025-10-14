import { LoadingManager } from './core/loading-manager.js';
import { App } from './core/app.js';
import { MapsList } from './ui/maps-hub/list.js';
import { LightPropertiesUI } from './ui/properties/light-properties-ui.js';
import { TextPropertiesUI } from './ui/properties/text-properties-ui.js';
import { ShapePropertiesUI } from './ui/properties/shape-properties-ui.js';
import { ConnectorPropertiesUI } from './ui/properties/connector-properties-ui.js';
import { ModelPropertiesUI } from './ui/properties/model-properties-ui.js';
import { ObjectListUI } from './ui/object-list-ui.js';
import { InputFocusManager } from './input/input-focus-manager.js';
import { CameraController } from './camera/camera-controller.js';
import { ToolManager } from './tools/tool-manager.js';
import { TextObject } from './text/text-object.js';
import { LightObject } from './lights/light-object.js';
import { ShapeObject } from './shapes/shape-object.js';
import { ConnectorObject } from './connectors/connector-object.js';
import { NPCObject } from './npc/npc-object.js';
import { saveMap } from './persistence/save-manager.js';
import { loadMap } from './persistence/save-manager.js';
import { getMapData } from './map/map-storage.js';
import { deleteMap } from './map/map-storage.js';
import { MapActions } from './map/map-actions.js';
import { MapManager } from './map/map-manager.js';
import { save } from './map/map-manager.js';
import { loadMap as loadMapFunction } from './map/map-manager.js';
import { getSavedMaps } from './map/map-storage.js';
import { getUntitledMapCount } from './map/map-storage.js';
import { clear } from './map/map-actions.js';
import { addObjectDirect } from './map/map-manager.js';
import { removeObject } from './map/map-actions.js';
import { updateObjectProperties } from './map/map-actions.js';
import { getObjectById } from './map/map-manager.js';
import { generateId } from './map/map-manager.js';
import { autoSave } from './map/map-manager.js';
import { getMapData as getMapDataFunction } from './map/map-manager.js';
import { deleteMap as deleteMapFunction } from './map/map-manager.js';
import { exportXML } from './map/map-manager.js';
import { import * as THREE from 'three'; } from 'three';
import { serializeMap } from './map/serialize-map-v2.js';
import { deserializeMap } from './map/deserialize-map-v2.js';

import { PRECISION } from './map/serialize-utils.js';
import { posToArray } from './map/serialize-utils.js';
import { rotToArray } from './map/serialize-utils.js';
import { arrayToPos } from './map/serialize-utils.js';
import { arrayToRot } from './map/serialize-utils.js';
import { isDefaultPosition } from './map/serialize-utils.js';
import { isDefaultRotation } from './map/serialize-utils.js';
import { deepEqual } from './map/serialize-utils.js';
import { safeCloneVec } from './map/serialize-utils.js';

import { createGhost } from './tools/placement/ghost-factory.js';
import { disposeGhost } from './tools/placement/ghost-factory.js';
import { handleLegacyFormat } from './map/deserialize-map-v2.js';
import { isMapPiece } from './tools/placement/placement-helpers.js';

import { addMap } from './ui/maps-hub/events.js';
import { show } from './ui/maps-hub/events.js';

const PRECISION = 2;

const mapManager = {
  sceneManager: new THREE.Scene(),
  historyManager: new MapActions(),
  objects: [],
  mapName: 'Untitled Map',
  isDirty: false,
  metadata: { typeTags: [], themeTags: [], gameplayTags: [] },
  _saveStore: new SaveStore(),
  _actions: new MapActions(),
};

const sceneManager = {
  camera: new THREE.PerspectiveCamera(60, 1, 0.1, 1000),
  scene: new THREE.Scene(),
};

const loadingManager = new LoadingManager();
const app = new App(loadingManager);

async function main() {
  const app = new App(loadingManager);
  await app.initialize();
  window.app = app;

  loadingManager.hide();
}

main();

const MapsList = {
  constructor(renderer) {
    this.renderer = renderer;
    this.saveManager = renderer.saveManager;
    this.mapManager = renderer.mapManager;
    this.historyManager = renderer.historyManager;
  },

  renderLocalList() {
    const listEl = this.renderer.container.querySelector('#maps-hub-list');
    const maps = this.saveManager.getSavedMaps();
    if (!maps || maps.length === 0) {
      listEl.innerHTML = '<div class="empty-state" data-empty> No saved maps.</div>';
      return;
    }

    const placeholder = '/sitcomreality.png';
    listEl.innerHTML = maps.map(m => {
      const src = m.thumbnail ? m.thumbnail : placeholder;
      return `
      <div class="map-list-item" data-map-name="${m.name}">
        <img class="preview-thumb" src="${src}" alt="${m.name} thumbnail" />
        <div class="map-list-meta">
          <div class="map-list-title">${m.name}</div>
          <div class="map-list-sub">${(m.objectCount||0)} objects • ${m.lastModified ? new Date(m.lastModified).toLocaleString() : 'unknown'}</div>
        </div>
      </div>
    `).join('');
    listEl.querySelectorAll('.map-list-item').forEach(item => {
      item.addEventListener('click', () => this.handleSelectLocal(item.dataset.mapName));
    });
  },

  handleSelectLocal(name) {
    const maps = this.saveManager.getSavedMaps();
    const map = maps.find(m => m.name === name);
    const detailsEl = this.renderer.container.querySelector('#maps-hub-details');
    const rightContent = this.renderer.container.querySelector('#maps-hub-right-content');
    const rightMeta = this.renderer.container.querySelector('#maps-hub-right-meta');

    if (!map) {
      detailsEl.innerHTML = '<div class="empty-state" style="color:#888;">Map not found.</div>';
      return;
    }

    // Update right column
    const ph = this.renderer.container.querySelector('.preview-placeholder');
    ph?.remove();
    rightContent.style.display = 'flex';
    const img = this.renderer.container.querySelector('#maps-hub-right-content .preview-thumb');
    img.src = map.thumbnail || '/sitcomreality.png';
    rightMeta.innerHTML = `<div style="font-weight:600;">${map.name}</div><div style="font-size:12px;color:#888;">${(map.objectCount||0)} objects • ${map.lastModified ? new Date(map.lastModified).toLocaleString() : 'unknown'}</div>`;

    detailsEl.innerHTML = `<div style="display:flex;gap:8px;"><button id="maps-hub-load" class="modal-btn primary-btn">Load</button><button id="maps-hub-delete" class="modal-btn danger-btn">Delete</button></div>`;

    detailsEl.querySelector('#maps-hub-load')?.addEventListener('click', () => {
      if (this.mapManager.isDirty && !confirm('Unsaved changes will be lost. Continue?')) return;
      this.saveManager.loadMap(map.name);
      this.historyManager.clear();
      this.renderer.hide();
    });

    detailsEl.querySelector('#maps-hub-delete')?.addEventListener('click', () => {
      if (!confirm(`Delete \"${map.name}\"? This cannot be undone.`)) return;
      this.saveManager.deleteMap(map.name);
      this.renderLocalList();
      detailsEl.innerHTML = '<div class="empty-state" style="color:#888;">Select a map to see details</div>';
    });

    this.renderer.selectedMapName = map.name;
  },
};

const LightPropertiesUI = {
  constructor(mapObject, container, mapManager) {
    this.mapObject = mapObject;
    this.container = container;
    this.mapManager = mapManager;
    this.textObj = mapObject.object;
    this.config = this.textObj.config;
  },

  render() {
    this.container.innerHTML = `
      <div class="properties-content">
        <div class="property-group">
          <label>Text Content</label>
          <textarea id="text-content" rows="3" style="width:100%; padding:8px; background:#0a0a0a; border:1px solid #2a2a2a; color:#e0e0e0; border-radius:4px; font-family:'Noto Sans'; font-size:13px; resize:vertical;"></textarea>
        </div>
        <div class="property-group">
          <label>Font Size</label>
          <input type="number" id="text-font-size" value="${this.config.fontSize}" min="0.1" max="10" step="0.1"/>
        </div>
        <div class="property-group">
          <label>Extrusion Depth</label>
          <input type="number" id="text-extrusion" value="${this.config.extrusionDepth}" min="0" max="5" step="0.1"/>
        </div>
        <div class="property-group property-color-group">
          <label for="text-color">Color</label>
          <input type="color" id="text-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
        </div>
      </div>
    `;
  },
};

const TextPropertiesUI = {
  constructor(mapObject, container, mapManager) {
    this.mapObject = mapObject;
    this.container = container;
    this.mapManager = mapManager;
    this.textObj = mapObject.object;
    this.config = this.textObj.config;
  },

  render() {
    this.container.innerHTML = `
      <div class="properties-content">
        <div class="property-group">
          <label>Text Content</label>
          <textarea id="text-content" rows="3" style="width:100%; padding:8px; background:#0a0a0a; border:1px solid #2a2a2a; color:#e0e0e0; border-radius:4px; font-family:'Noto Sans'; font-size:13px; resize:vertical;"></textarea>
        </div>
        <div class="property-group">
          <label>Font Size</label>
          <input type="number" id="text-font-size" value="${this.config.fontSize}" min="0.1" max="10" step="0.1"/>
        </div>
        <div class="property-group">
          <label>Extrusion Depth</label>
          <input type="number" id="text-extrusion" value="${this.config.extrusionDepth}" min="0" max="5" step="0.1"/>
        </div>
        <div class="property-group property-color-group">
          <label for="text-color">Color</label>
          <input type="color" id="text-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
        </div>
      </div>
    `;
  },
};

const ShapePropertiesUI = {
  constructor(mapObject, container, mapManager) {
    this.mapObject = mapObject;
    this.container = container;
    this.mapManager = mapManager;
    this.shapeObj = mapObject.object;
    this.config = this.shapeObj.config;
  },

  render() {
    this.container.innerHTML = `
      <div class="properties-content">
        <div class="property-group">
          <label>Color</label>
          <input type="color" id="shape-color" value="#${this.config.color.toString(16).padStart(6, '0')}"/>
        </div>
        <div class="property-group">
          <label>Dimensions</label>
          <div class="property-row">
            <input type="number" id="shape-width" step="0.1" value="${(this.config.width??1).toFixed(2)}"/>
            <input type="number" id="shape-height" step="0.1" value="${(this.config.height??1).toFixed(2)}"/>
            <input type="number" id="shape-depth" step="0.1" value="${(this.config.depth??1).toFixed(2)}"/>
          </div>
        </div>
        <div class="property-group">
          <label>Radius</label>
          <input type="number" id="shape-radius" step="0.1" value="${(this.config.radius??0.5).toFixed(2)}"/>
        </div>
      </div>
    `;
  },
};

const ModelPropertiesUI = {
  constructor(mapObject, container, mapManager) {
    this.mapObject = mapObject;
    this.container = container;
    this.mapManager = mapManager;
  },

  render() {
    this.container.innerHTML = `
      <div class="properties-content">
        <div class="property-group">
          <label>Name</label>
          <input type="text" id="prop-name" value="${this.mapObject.name || this.mapObject.assetName}"/>
        </div>
        <div class="property-group">
          <label>Position</label>
          <div class="property-row">
            <input type="number" id="prop-pos-x" value="${this.mapObject.position.x.toFixed(2)}" step="0.1"/>
            <input type="number" id="prop-pos-y" value="${this.mapObject.position.y.toFixed(2)}" step="0.1"/>
            <input type="number" id="prop-pos-z" value="${this.mapObject.position.z.toFixed(2)}" step="0.1"/>
          </div>
        </div>
        <div class="property-group">
          <label>Rotation (Degrees)</label>
          <div class="property-row">
            <input type="number" id="prop-rot-x" value="${(this.mapObject.rotation.x * 180 / Math.PI).toFixed(1)}" step="1"/>
            <input type="number" id="prop-rot-y" value="${(this.mapObject.rotation.y * 180 / Math.PI).toFixed(1)}" step="1"/>
            <input type="number" id="prop-rot-z" value="${(this.mapObject.rotation.z * 180 / Math.PI).toFixed(1)}" step="1"/>
          </div>
        </div>
      </div>
    `;
  },
};

const ObjectListUI = {
  constructor(mapManager, toolManager) {
    this.mapManager = mapManager;
    this.toolManager = toolManager;
    this.container = null;
    this.isCollapsed = false;
    this.render();
    this.setupEventListeners();
  },

  setupEventListeners() {
    window.addEventListener('mapObjectsChanged', () => this.updateList());
    window.addEventListener('objectSelected', (e) => this.highlightItem(e.detail.id));
    window.addEventListener('objectDeselected', () => this.clearHighlight());
  },

  render() {
    this.container = document.createElement('div');
    this.container.className = 'panel-section';
    this.container.innerHTML = `
      <div class="panel-section-header" id="object-list-header">
        <h3>Scene Objects</h3>
        <span class="panel-section-toggle">▼</span>
      </div>
      <div class="panel-section-content">
        <div class="object-list" id="object-list">
          <div class="empty-state">No objects in scene</div>
        </div>
      </div>
    `;
    document.getElementById('sidebar-right').appendChild(this.container);

    // Toggle collapse
    this.container.querySelector('#object-list-header').addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.container.querySelector('.panel-section-header').classList.toggle('collapsed', this.isCollapsed);
    });

    this.addStyles();
  },

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .object-list {
        padding: 0;
        max-height: 300px;
        overflow-y: auto;
      }
      .empty-state {
        padding: 32px 16px;
        text-align: center;
        color: #666;
        font-size: 13px;
      }
      .object-list-item {
        padding: 10px 16px;
        cursor: pointer;
        font-size: 13px;
        border-bottom: 1px solid #1a1a1a;
        transition: background 0.15s ease;
      }
      .object-list-item:hover {
        background: #1a1a1a;
      }
      .object-list-item.selected {
        background: #4a9eff;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  },

  updateList() {
    const listContainer = this.container.querySelector('#object-list');

    if (this.mapManager.objects.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No objects in scene</div>';
      return;
    }

    // Separate lights, text, and other objects
    const lights = this.mapManager.objects.filter(o => o.type === 'light');
    const texts = this.mapManager.objects.filter(o => o.type === 'text');
    const shapes = this.mapManager.objects.filter(o => o.type === 'shape');
    const connectors = this.mapManager.objects.filter(o => o.type === 'connector');
    const others = this.mapManager.objects.filter(o => o.type !== 'light' && o.type !== 'text' && o.type !== 'shape' && o.type !== 'connector' && o.type !== 'npc');
    const npcs = this.mapManager.objects.filter(o => o.type === 'npc');

    let html = '';

    // Lights section first
    if (lights.length > 0) {
      html += '<div class="object-list-section-header">Lights</div>';
      html += lights.map(obj => `
        <div class="object-list-item light-object" data-id="${obj.id}">
          💡 ${obj.name || obj.assetName}
        </div>
      `).join('');
    }

    // Text section
    if (texts.length > 0) {
      html += '<div class="object-list-section-header">Text</div>';
      html += texts.map(obj => `
        <div class="object-list-item text-object" data-id="${obj.id}">
          📝 ${obj.name || obj.assetName}
        </div>
      `).join('');
    }

    // Shapes section
    if (shapes.length > 0) {
      html += '<div class="object-list-section-header">Shapes</div>';
      html += shapes.map(obj => `
        <div class="object-list-item text-object" data-id="${obj.id}">
          ■ ${obj.name || obj.assetName}
        </div>
      `).join('');
    }

    // Connectors section
    if (connectors.length > 0) {
      html += '<div class="object-list-section-header">Connectors</div>';
      html += connectors.map(obj => `
        <div class="object-list-item text-object" data-id="${obj.id}">
          ☍ ${obj.name || obj.assetName}
        </div>
      `).join('');
    }

    // NPCs section
    if (npcs.length > 0) {
      html += '<div class="object-list-section-header">NPCs</div>';
      html += npcs.map(obj => `
        <div class="object-list-item text-object" data-id="${obj.id}">
          🧍 ${obj.name || obj.assetName}
        </div>
      `).join('');
    }

    // Other objects section
    if (others.length > 0) {
      html += '<div class="object-list-section-header">Objects</div>';
      html += others.map(obj => `
        <div class="object-list-item" data-id="${obj.id}">
          ${obj.name || obj.assetName}
        </div>
      `).join('');
    }

    listContainer.innerHTML = html;

    // Attach click handlers
    listContainer.querySelectorAll('.object-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const mapObject = this.mapManager.getObjectById(id);
        if (mapObject) {
          this.toolManager.setTool('select');
          const objectToSelect = (mapObject.type === 'light' || mapObject.type === 'text' || mapObject.type === 'shape' || mapObject.type === 'connector' || mapObject.type === 'npc')
            ? mapObject.object.container
            : mapObject.object;
          this.toolManager.tools.select.selectObject(objectToSelect);
        }
      });
    });
  },

  highlightItem(id) {
    this.clearHighlight();
    const item = this.container.querySelector(`.object-list-item[data-id=\"${id}\"]`);
    if (item) {
      item.classList.add('selected');
      // Scroll into view if needed
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  clearHighlight() {
    this.container.querySelectorAll('.object-list-item.selected').forEach(item => {
      item.classList.remove('selected');
    });
  },
};

const InputFocusManager = {
  constructor() {
    this.textInputFocused = false;
    this.searchInput = null;
    this.init();
  },

  init() {
    document.addEventListener('focusin', () => {
      const el = document.activeElement;
      this.textInputFocused = this.isTextEntry(el);
    });
    document.addEventListener('focusout', () => {
      const el = document.activeElement;
      this.textInputFocused = this.isTextEntry(el);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.focusAssetSearch(true);
      }
      if (e.key === 'Escape') {
        this.clearAndBlurSearch();
      }
      if (e.key === 'Enter' && this.searchInput) {
        this.searchInput.blur();
      }
    });

    window.addEventListener('toolChanged', (e) => {
      if (e.detail?.tool === 'placement') {
        this.clearAndBlurSearch();
      }
    });
  },

  registerSearchInput(el) {
    this.searchInput = el;
  },

  focusAssetSearch(clear = false) {
    if (!this.searchInput) return;
    if (clear) this.searchInput.value = '';
    this.searchInput.focus();
    this.textInputFocused = true;
  },

  clearAndBlurSearch() {
    if (!this.searchInput) return;
    this.searchInput.value = '';
    this.searchInput.blur();
    this.textInputFocused = false;
  },

  isTextEntry(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if (el.isContentEditable) return true;
    const role = el.getAttribute?.('role');
    return role === 'textbox';
  },

  isTextInputFocused() {
    return this.textInputFocused;
  },
};

const CameraController = {
  constructor(camera, container, inputFocusManager) {
    this.camera = camera;
    this.container = container;
    this.inputFocusManager = inputFocusManager;

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false
    };

    // Initialize camera with top-down angled view aligned to grid
    this.rotation = { x: -Math.PI / 3, y: 0 };
    this.camera.rotation.order = 'YXZ';
    this.updateCameraRotation();
    this.isRightMouseDown = false;
    this.isMiddleMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.moveSpeed = 0.5;
    this.rotateSpeed = 0.003;
    this.zoomSpeed = 2.5; // increased from 0.5 -> faster scroll zoom

    this.bounds = new CameraBounds(this);
    this.transitions = new CameraTransitions(this);

    this.isOrthographic = false;
    this.perspectiveCamera = camera;
    this.orthographicCamera = null;

    this.savedState = null;
  },

  handleKeyDown(event) {
    const blockMove = this.inputFocusManager?.isTextInputFocused?.();
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        if (!blockMove) this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        if (!blockMove) this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        if (!blockMove) this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        if (!blockMove) this.keys.right = true;
        break;
      case 'Equal':
      case 'NumpadAdd':
        this.adjustSpeed(0.1);
        break;
      case 'Minus':
      case 'NumpadSubtract':
        this.adjustSpeed(-0.1);
        break;
    }
  },

  handleKeyUp(event) {
    const blockMove = this.inputFocusManager?.isTextInputFocused?.();
    switch(event.code) {
      case 'KeyW':
      case 'ArrowUp':
        if (!blockMove) this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        if (!blockMove) this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        if (!blockMove) this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        if (!blockMove) this.keys.right = false;
        break;
    }
  },

  handleMouseDown(event) {
    if (event.button === 2) {
      this.isRightMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    } else if (event.button === 1) {
      this.isMiddleMouseDown = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  },

  handleMouseUp(event) {
    if (event.button === 2) {
      this.isRightMouseDown = false;
    } else if (event.button === 1) {
      this.isMiddleMouseDown = false;
    }
  },

  handleMouseMove(event) {
    if (this.isRightMouseDown) {
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      this.rotation.y -= deltaX * this.rotateSpeed;
      this.rotation.x -= deltaY * this.rotateSpeed;
      this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x));

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    } else if (this.isMiddleMouseDown) {
      const deltaX = event.clientX - this.lastMouseX;
      const deltaY = event.clientY - this.lastMouseY;

      const right = new THREE.Vector3();
      this.camera.getWorldDirection(new THREE.Vector3());
      right.crossVectors(this.camera.up, new THREE.Vector3()); //this.camera.up.clone().cross(new THREE.Vector3(0, 0, -1)).normalize();
      //this.camera.up.clone().cross(new THREE.Vector3()); //this.camera.up.clone().cross(new THREE.Vector3()); //right.crossVectors(this.camera.up, new THREE.Vector3());
      //right.normalize(); //right.crossVectors(this.camera.up, new THREE.Vector3()); //right.normalize();
      this.camera.position.x -= right.x * deltaX * 0.01;
      this.camera.position.z -= right.z * deltaX * 0.01;
      this.camera.position.y += deltaY * 0.01;

      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  },

  handleWheel(event) {
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    // stronger per-wheel multiplier combined with increased zoomSpeed for noticeably faster zoom
    const distance = event.deltaY * -0.002 * this.zoomSpeed;
    this.camera.position.addScaledVector(direction, distance);
  },

  adjustSpeed(delta) {
    this.moveSpeed = Math.max(0.1, Math.min(2.0, this.moveSpeed + delta));
    window.dispatchEvent(new CustomEvent('cameraSpeedChanged', { 
      detail: { speed: this.moveSpeed } 
    }));
  },

  setSpeed(speed) {
    this.moveSpeed = Math.max(0.1, Math.min(2.0, speed));
  },

  updateCameraRotation() {
    this.camera.rotation.y = this.rotation.y;
    this.camera.rotation.x = this.rotation.x;
  },

  update() {
    // Don't update camera if cinematic mode is playing
    const cinematicPlaying = window.cinematicManager?.timeline?.isPlaying;
    if (cinematicPlaying) {
      return;
    }

    if (this.transitions.isTransitioning) {
      this.transitions.update();
      return;
    }

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(this.camera.up, direction).normalize();

    if (this.keys.forward) {
      this.camera.position.addScaledVector(direction, this.moveSpeed);
    }
    if (this.keys.backward) {
      this.camera.position.addScaledVector(direction, -this.moveSpeed);
    }
    if (this.keys.left) {
      this.camera.position.addScaledVector(right, this.moveSpeed);
    }
    if (this.keys.right) {
      this.camera.position.addScaledVector(right, -this.moveSpeed);
    }

    this.bounds.apply();
    this.updateCameraRotation();
  },

  saveState() {
    this.savedState = this.getCameraState();
  },

  restoreState() {
    if (this.savedState) {
      this.setCameraState(this.savedState);
      this.savedState = null;
    }
  },

  focusOnObject(object) {
    if (!object) return;

    const boundingBox = new THREE.Box3().setFromObject(object);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    const targetPosition = center.clone().sub(direction.multiplyScalar(distance));
    targetPosition.y = Math.max(targetPosition.y, center.y + 5);

    this.transitions.transitionTo(targetPosition, this.rotation);
  },

  toggleOrthographic(sceneManager) {
    this.isOrthographic = !this.isOrthographic;

    if (this.isOrthographic) {
      if (!this.orthographicCamera) {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 20;
        this.orthographicCamera = new THREE.OrthographicCamera(
          -frustumSize * aspect / 2, frustumSize * aspect / 2,
          frustumSize / 2, -frustumSize / 2,
          0.1, 1000
        );
        // Position for a true top-down view
        this.orthographicCamera.position.set(0, 50, 0);
        this.orthographicCamera.lookAt(0, 0, 0);
      }

      this.orthographicCamera.position.copy(this.perspectiveCamera.position);
      this.orthographicCamera.rotation.copy(this.perspectiveCamera.rotation);
      sceneManager.setCamera(this.isOrthographic ? this.orthographicCamera : this.perspectiveCamera);
      this.camera = sceneManager.camera;
    } else {
      // Restore perspective camera state
      this.perspectiveCamera.position.copy(this.camera.position);
      this.perspectiveCamera.rotation.copy(this.camera.rotation);
      sceneManager.setCamera(this.isOrthographic ? this.orthographicCamera : this.perspectiveCamera);
      this.camera = sceneManager.camera;
    }

    window.dispatchEvent(new CustomEvent('cameraTypeChanged', {
      detail: { isOrthographic: this.isOrthographic }
    }));
  },

  getCameraState() {
    return {
      position: this.camera.position.clone(),
      rotation: { ...this.rotation },
      isOrthographic: this.isOrthographic
    };
  },

  setCameraState(state) {
    this.transitions.transitionTo(state.position, state.rotation);
    if (state.isOrthographic !== this.isOrthographic) {
      // Handle orthographic toggle if needed
    }
  },
};

const ToolManager = {
  constructor(sceneManager, inputManager, mapManager, historyManager) {
    this.sceneManager = sceneManager;
    this.inputManager = inputManager;
    this.mapManager = mapManager;
    this.historyManager = historyManager;

    this.tools = {
      none: new NoneTool(sceneManager, inputManager),
      select: new SelectTool(sceneManager, inputManager, mapManager),
      placement: new PlacementTool(sceneManager, inputManager, mapManager, historyManager),
      connector: new ConnectorTool(sceneManager, inputManager, mapManager, historyManager),
      pickup: null, // Will be initialized after
      delete: new DeleteTool(sceneManager, inputManager, mapManager, historyManager),
      rotate: new RotateTool(sceneManager, inputManager, mapManager, historyManager),
      copy: null, // Will be initialized after
      connector: new ConnectorTool(sceneManager, inputManager, mapManager, historyManager)
    };

    // Initialize pickup tool with reference to tool manager
    this.tools.pickup = new PickupTool(sceneManager, inputManager, mapManager, historyManager, this);
    this.tools.copy = new CopyTool(sceneManager, inputManager, mapManager, historyManager, this);

    this.currentTool = this.tools.select;
    this.snapToGrid = false;
  },

  setTool(toolName) {
    if (this.currentTool) {
      this.currentTool.deactivate();
    }

    this.currentTool = this.tools[toolName];
    if (this.currentTool) {
      this.currentTool.activate();
    }

    // Deactivate preview mode if a tool is manually selected
    if (window.app?.rotationPreviewManager?.isActive && toolName !== 'none') {
      window.app.rotationPreviewManager.toggle(false);
    }

    window.dispatchEvent(new CustomEvent('toolChanged', { detail: { tool: toolName } }));
  },

  setSnapToGrid(enabled) {
    this.snapToGrid = enabled;
    Object.values(this.tools).forEach(tool => {
      if (tool.setSnapToGrid) {
        tool.setSnapToGrid(enabled);
      }
    });
  },

  handleMouseMove(event) {
    if (this.currentTool && this.currentTool.handleMouseMove) {
      this.currentTool.handleMouseMove(event);
    }
  },

  handleMouseDown(event) {
    if (this.currentTool && this.currentTool.handleMouseDown) {
      this.currentTool.handleMouseDown(event);
    }
  },

  handleMouseUp(event) {
    if (this.currentTool && this.currentTool.handleMouseUp) {
      this.currentTool.handleMouseUp(event);
    }
  },

  handleKeyDown(event) {
    if (this.currentTool && this.currentTool.handleKeyDown) {
      this.currentTool.handleKeyDown(event);
    }
  },

  handleKeyUp(event) {
    if (this.currentTool && this.currentTool.handleKeyUp) {
      this.currentTool.handleKeyUp(event);
    }
  },

  handleWheel(event) {
    if (this.currentTool && typeof this.currentTool.handleWheel === 'function') {
      this.currentTool.handleWheel(event);
    } else {
      this.sceneManager.scene.render(); // always render scene after wheel to fix canvas dimensions
    }
  },

  update() {
    if (this.currentTool && this.currentTool.update) {
      this.currentTool.update();
    }
  },
};

const save = (name) => {
  const data = serializeMap(mapManager);
  mapManager._saveStore.saveMap(name, data);
  mapManager.isDirty = false;
};

const loadMapFunction = (name) => {
  const parsed = mapManager._saveStore.getMapData(name);
  if (!parsed) return false;
  try {
    const mapData = parsed.mapData || parsed;
    mapManager.deserialize(mapData, assetManager);
  } catch (e) {
    console.error(`Failed to load map: ${name}`, e);
    return false;
  }
  mapManager.isDirty = false;
  window.dispatchEvent(new CustomEvent('mapLoaded', { detail: { name } }));
  return true;
};

const getMapDataFunction = (name) => {
  const data = mapManager._saveStore.getMapData(name);
  return data;
};

const deleteMapFunction = (name) => {
  mapManager._saveStore.deleteMap(name);
  window.dispatchEvent(new CustomEvent('mapsChanged'));
};

const clear = () => {
  mapManager.clear();
  window.dispatchEvent(new CustomEvent('mapObjectsChanged'));
};

const addObjectDirect = (mapObject) => {
  mapManager._actions.addObjectDirect(mapObject);
};

const removeObject = (object) => {
  mapManager._actions.removeObject(object);
};

const updateObjectProperties = (mapObject, properties) => {
  mapManager._actions.updateObjectProperties(mapObject, properties);
};

const getObjectById = (id) => {
  return mapManager.getObjectById(id);
};

const generateId = () => {
  return mapManager.generateId();
};

const autoSave = () => {
  mapManager.autoSave();
};

const getSavedMaps = () => {
  return mapManager._saveStore.getSavedMaps();
};

const getUntitledMapCount = () => {
  return mapManager._saveStore.getUntitledMapCount();
};

const exportXML = () => {
  return mapManager.exportXML();
};

const importMap = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) { input.remove(); return; }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      localStorage.setItem(`map_${parsed?.metadata?.name || parsed?.name || file.name.replace(/\\.[^.]+$/, '')}`, JSON.stringify(parsed));
      const ok =