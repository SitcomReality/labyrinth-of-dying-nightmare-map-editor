export function addToolbarStyles() {
    if (document.getElementById('toolbar-inline-styles')) return;
    const style = document.createElement('style');
    style.id = 'toolbar-inline-styles';
    style.textContent = `
        .toolbar-content {
            display: flex;
            gap: 16px;
            padding: 8px 12px;
            align-items: center;
        }
        
        .tool-group {
            display: flex;
            gap: 4px;
            padding: 0 8px;
            border-right: 1px solid #2a2a2a;
        }
        
        .tool-group:last-child {
            border-right: none;
            margin-left: auto;
        }
        
        .tool-btn {
            background: transparent;
            border: 1px solid #2a2a2a;
            color: #e0e0e0;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 13px;
            border-radius: 4px;
            transition: all 0.15s ease;
        }
        
        .tool-btn:hover {
            background: #1a1a1a;
            border-color: #4a9eff;
        }
        
        .tool-btn.active {
            background: #4a9eff;
            border-color: #4a9eff;
            color: #fff;
        }
    `;
    document.head.appendChild(style);
}

