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

    const rotPreviewBtn = document.getElementById('rotation-preview-btn');
    if (rotPreviewBtn) {
        rotPreviewBtn.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            const isActive = e.currentTarget.classList.contains('active');
            window.dispatchEvent(new CustomEvent('toggleRotationPreview', { detail: { isActive } }));
        });
    }

    window.addEventListener('rotationPreviewChanged', (e) => {
        const btn = document.getElementById('rotation-preview-btn');
        if (btn) {
            btn.classList.toggle('active', e.detail.isActive);
        }
    });
}