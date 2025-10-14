export class ComponentsEditor {
  constructor(container, initialComponents = {}, onChange) {
    this.container = container;
    this.components = JSON.parse(JSON.stringify(initialComponents || {}));
    this.onChange = onChange || (()=>{});
  }
  render() {
    this.container.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <select id="comp-add-type" style="flex:1;padding:6px 8px;background:#0a0a0a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;">
          <option value="">Add component...</option>
          <option value="Collision">Collision</option>
          <option value="Trigger">Trigger</option>
          <option value="Navigation">Navigation</option>
          <option value="Custom">Custom...</option>
        </select>
        <button id="comp-add-btn" class="cinematic-btn">Add</button>
      </div>
      <div id="comp-list"></div>
    `;
    this.container.querySelector('#comp-add-btn')?.addEventListener('click', ()=> this.handleAdd());
    this.container.querySelector('#comp-add-type')?.addEventListener('change', (e)=> {
      if (e.target.value === 'Custom') this.handleAdd(true);
    });
    this.renderList();
  }
  handleAdd(isCustom = false) {
    const sel = this.container.querySelector('#comp-add-type');
    let type = sel?.value || '';
    if (isCustom) {
      const name = prompt('Custom component name (e.g., Health, Door):');
      if (!name) return;
      type = name;
    }
    if (!type) return;
    if (!this.components) this.components = {};
    if (!this.components[type]) {
      this.components[type] = this.getDefaultFor(type);
      this.onChange(this.components);
      this.renderList();
    } else {
      alert('Component already exists.');
    }
    sel.value = '';
  }
  getDefaultFor(type) {
    if (type === 'Collision') return { shape: 'circle', radius: 0.5 };
    if (type === 'Trigger') return { activationTrigger: 'OnEnter', actions: [] };
    if (type === 'Navigation') return { isWalkable: true, isNavigable: true };
    return {};
  }
  renderList() {
    const list = this.container.querySelector('#comp-list');
    const keys = Object.keys(this.components || {});
    if (keys.length === 0) {
      list.innerHTML = `<div style="font-size:12px;color:#777;">No components. Use "Add" to insert one.</div>`;
      return;
    }
    list.innerHTML = keys.map(k => `
      <div class="property-group" data-comp="${k}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong>${k}</strong>
          <button class="cinematic-btn" data-remove="${k}" style="background:#1a1a1a;border-color:#2a2a2a;color:#ff4a4a;">Remove</button>
        </div>
        ${this.renderComponentFields(k, this.components[k])}
      </div>
    `).join('');
    list.querySelectorAll('[data-remove]')?.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const key = btn.getAttribute('data-remove');
        delete this.components[key];
        this.onChange(this.components);
        this.renderList();
      });
    });
    // Wire inputs
    keys.forEach(k => this.attachFieldHandlers(k));
  }
  renderComponentFields(name, data) {
    if (name === 'Collision') {
      return `
        <div class="property-row">
          <select data-field="shape" style="padding:6px 8px;background:#0a0a0a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;">
            ${['circle','box','capsule'].map(s=>`<option value="${s}" ${data.shape===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <input type="number" data-field="radius" step="0.1" placeholder="radius" value="${data.radius ?? ''}">
          <input type="number" data-field="width" step="0.1" placeholder="width" value="${data.width ?? ''}">
        </div>
        <div class="property-row" style="margin-top:6px;">
          <input type="number" data-field="height" step="0.1" placeholder="height" value="${data.height ?? ''}">
          <input type="number" data-field="depth" step="0.1" placeholder="depth" value="${data.depth ?? ''}">
        </div>
      `;
    }
    if (name === 'Trigger') {
      const actions = Array.isArray(data.actions) ? data.actions : [];
      return `
        <div class="property-group">
          <label>Activation</label>
          <select data-field="activationTrigger" style="width:100%;padding:6px 8px;background:#0a0a0a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;">
            ${['OnEnter','OnExit','Event'].map(v=>`<option value="${v}" ${data.activationTrigger===v?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="property-group">
          <label style="display:flex;justify-content:space-between;align-items:center;">Actions
            <button class="cinematic-btn" data-add-action style="margin-left:auto;">Add Action</button>
          </label>
          <div data-actions>
            ${actions.map((a,i)=>this.renderActionRow(a,i)).join('')}
          </div>
        </div>
      `;
    }
    if (name === 'Navigation') {
      return `
        <label><input type="checkbox" data-field="isWalkable" ${data.isWalkable ? 'checked':''} style="margin-right:6px;">Walkable</label>
        <label style="margin-left:12px;"><input type="checkbox" data-field="isNavigable" ${data.isNavigable ? 'checked':''} style="margin-right:6px;">Navigable</label>
      `;
    }
    // Fallback: raw JSON per custom component
    return `
      <label style="display:block;margin-bottom:4px;color:#888;">Custom JSON</label>
      <textarea data-field="__raw" rows="4" style="width:100%;padding:8px;background:#0a0a0a;border:1px solid #2a2a2a;color:#e0e0e0;border-radius:4px;font-size:13px;">${JSON.stringify(data || {}, null, 2)}</textarea>
    `;
  }
  renderActionRow(a, i) {
    return `
      <div class="property-row" data-action="${i}" style="align-items:center;">
        <input type="text" data-action-field="type" placeholder="type" value="${a.type ?? ''}">
        <input type="text" data-action-field="parameter" placeholder="parameter" value="${a.parameter ?? ''}">
        <input type="text" data-action-field="target" placeholder="target/eventChannel" value="${a.target ?? a.eventChannel ?? ''}">
        <button class="cinematic-btn" data-remove-action="${i}" style="background:#1a1a1a;border-color:#2a2a2a;color:#ff4a4a;">×</button>
      </div>
    `;
  }
  attachFieldHandlers(name) {
    const group = this.container.querySelector(`[data-comp="${name}"]`);
    if (!group) return;
    if (name === 'Trigger') {
      group.querySelector('[data-add-action]')?.addEventListener('click', ()=>{
        if (!Array.isArray(this.components.Trigger.actions)) this.components.Trigger.actions = [];
        this.components.Trigger.actions.push({ type:'', parameter:'', target:'' });
        this.onChange(this.components);
        this.renderList();
      });
      group.querySelectorAll('[data-remove-action]')?.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const idx = parseInt(btn.getAttribute('data-remove-action'),10);
          this.components.Trigger.actions.splice(idx,1);
          this.onChange(this.components);
          this.renderList();
        });
      });
      group.querySelectorAll('[data-action-field]')?.forEach(inp=>{
        inp.addEventListener('input', ()=>{
          const row = inp.closest('[data-action]');
          const idx = parseInt(row.getAttribute('data-action'),10);
          const field = inp.getAttribute('data-action-field');
          const act = this.components.Trigger.actions[idx] || {};
          act[field] = inp.value;
          this.components.Trigger.actions[idx] = act;
          this.onChange(this.components);
        });
      });
    }
    // generic field handlers
    group.querySelectorAll('[data-field]')?.forEach(el=>{
      const field = el.getAttribute('data-field');
      if (field === '__raw') {
        el.addEventListener('blur', ()=>{
          try {
            this.components[name] = JSON.parse(el.value || '{}');
            this.onChange(this.components);
            this.renderList();
          } catch {
            alert('Invalid JSON for custom component.');
          }
        });
        return;
      }
      const handler = (e)=>{
        const v = (el.type === 'checkbox') ? el.checked : (el.type === 'number' ? parseFloat(el.value) : el.value);
        if (!this.components[name] || typeof this.components[name] !== 'object') this.components[name] = {};
        this.components[name][field] = v;
        this.onChange(this.components);
      };
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', handler);
    });
  }
}