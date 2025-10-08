export function setupToolbarEvents({ ui, toolManager, mapManager, historyManager }) {
    // expose references for attachToolbarListeners (bound to ui)
    ui.toolManager = toolManager;
    ui.mapManager = mapManager;
    ui.historyManager = historyManager;

    window.addEventListener('historyChanged', () => ui.updateHistoryButtons());
    window.addEventListener('toolChanged', (e) => {
        const t = e.detail?.tool;
        ui.container.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
    });
}