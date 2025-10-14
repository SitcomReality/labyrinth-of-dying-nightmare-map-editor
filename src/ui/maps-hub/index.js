import { MapsHubRenderer } from './render.js';
import { attachMapsHubEvents } from './events.js';
import { addMapsHubStyles } from './styles.js';

export class MapsHubUI {
  constructor(saveManager, mapManager, historyManager) {
    this.saveManager = saveManager;
    this.mapManager = mapManager;
    this.historyManager = historyManager;
    this.container = null;
    addMapsHubStyles();
    this.renderer = new MapsHubRenderer(this.saveManager, this.mapManager, this.historyManager);
    attachMapsHubEvents(this.renderer, this);
  }

  show() {
    this.renderer.show();
  }

  hide() {
    this.renderer.hide();
  }

  refresh() {
    this.renderer.renderList();
  }
}