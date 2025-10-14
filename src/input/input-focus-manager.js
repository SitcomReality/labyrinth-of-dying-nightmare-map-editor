export class InputFocusManager {
    constructor() {
        this.textInputFocused = false;
        this.searchInput = null;
        this.init();
    }

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
        });

        window.addEventListener('toolChanged', (e) => {
            if (e.detail?.tool === 'placement') {
                this.clearAndBlurSearch();
            }
        });
    }

    registerSearchInput(el) {
        this.searchInput = el;
    }

    focusAssetSearch(clear = false) {
        if (!this.searchInput) return;
        if (clear) this.searchInput.value = '';
        this.searchInput.focus();
        this.textInputFocused = true;
    }

    clearAndBlurSearch() {
        if (!this.searchInput) return;
        this.searchInput.value = '';
        this.searchInput.blur();
        this.textInputFocused = false;
    }

    isTextEntry(el) {
        if (!el) return false;
        const tag = el.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return true;
        if (el.isContentEditable) return true;
        const role = el.getAttribute?.('role');
        return role === 'textbox';
    }

    isTextInputFocused() {
        return this.textInputFocused;
    }
}

