export class NPCPropertiesUI {
    constructor(mapObject, container, mapManager) {
        this.mapObject = mapObject;
        this.container = container;
        this.mapManager = mapManager;
        this.npcObj = mapObject.object;
        this.config = this.npcObj.config;
        this.listeners = [];
    }
    render() {
        this.container.innerHTML = `
            <div class=\"panel-header\"><h2>NPC Properties</h2></div>
            <div class=\"properties-content\">
                <div class=\"property-group\">
                    <label>Name</label>
                    <input type=\"text\" id=\"prop-name\" value=\"${this.mapObject.name || this.mapObject.assetName}\" />
                </div>
                <div class=\"property-group\">
                    <label>Position</label>
                    <div class=\"property-row\">
                        <input type=\"number\" id=\"prop-pos-x\" value=\"${this.mapObject.position.x.toFixed(2)}\" step=\"0.1\" />
                        <input type=\"number\" id=\"prop-pos-y\" value=\"${this.mapObject.position.y.toFixed(2)}\" step=\"0.1\" />
                        <input type=\"number\" id=\"prop-pos-z\" value=\"${this.mapObject.position.z.toFixed(2)}\" step=\"0.1\" />
                    </div>
                </div>
                <div class=\"property-group\">
                    <label>NPC Type</label>
                    <input type=\"text\" id=\"npc-type\" value=\"${this.config.npcType || ''}\" placeholder=\"e.g., guard, merchant\"/>
                </div>
                <div class=\"property-group\">
                    <label>Property A</label>
                    <input type=\"text\" id=\"npc-prop-a\" value=\"${this.config.propA || ''}\" placeholder=\"(placeholder)\"/>
                </div>
                <div class=\"property-group\">
                    <label>Property B</label>
                    <input type=\"text\" id=\"npc-prop-b\" value=\"${this.config.propB || ''}\" placeholder=\"(placeholder)\"/>
                </div>
            </div>
        `;
        this.attachListeners();
    }
    attachListeners() {
        const on = (sel, ev, fn) => {
            const el = this.container.querySelector(sel);
            if (el) { el.addEventListener(ev, fn); this.listeners.push({ el, ev, fn }); }
        };
        on('#prop-name','change',(e)=>{ this.mapObject.name = e.target.value; this.mapManager.updateObjectProperties(this.mapObject, { name: e.target.value }); });
        ['x','y','z'].forEach(axis=>{
            on(`#prop-pos-${axis}`,'change',(e)=>{
                this.npcObj.container.position[axis] = parseFloat(e.target.value);
                this.mapManager.updateObjectProperties(this.mapObject, {});
            });
        });
        on('#npc-type','input',(e)=>{ this.npcObj.setType(e.target.value); this.mapManager.updateObjectProperties(this.mapObject, {}); });
        on('#npc-prop-a','input',(e)=>{ this.npcObj.setPropA(e.target.value); this.mapManager.updateObjectProperties(this.mapObject, {}); });
        on('#npc-prop-b','input',(e)=>{ this.npcObj.setPropB(e.target.value); this.mapManager.updateObjectProperties(this.mapObject, {}); });
    }
    destroy() {
        this.listeners.forEach(({el,ev,fn})=>el.removeEventListener(ev,fn));
        this.listeners = [];
        this.container.innerHTML = '';
    }
}