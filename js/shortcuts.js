/* NEXUS — Keyboard Shortcuts Panel (Phase 9)
   Press `?` to show all shortcuts, grouped by category
*/
const Shortcuts = (() => {
    let initialized = false;

    const groups = [
        {
            name: 'Navigation', icon: '🧭',
            shortcuts: [
                { keys: ['Ctrl', 'K'], desc: 'Search messages & bookmarks' },
                { keys: ['Ctrl', 'N'], desc: 'New chat' },
                { keys: ['Ctrl', ','], desc: 'Open settings' },
                { keys: ['?'], desc: 'Show keyboard shortcuts' },
                { keys: ['Esc'], desc: 'Close any modal / panel' },
            ]
        },
        {
            name: 'Chat', icon: '💬',
            shortcuts: [
                { keys: ['Enter'], desc: 'Send message' },
                { keys: ['Shift', 'Enter'], desc: 'New line in message' },
                { keys: ['/'], desc: 'Open prompt templates' },
                { keys: ['Ctrl', 'Shift', 'E'], desc: 'Export current chat' },
            ]
        },
        {
            name: 'Voice', icon: '🎤',
            shortcuts: [
                { keys: ['Ctrl', 'Shift', 'M'], desc: 'Toggle voice input' },
            ]
        },
        {
            name: 'View', icon: '🎨',
            shortcuts: [
                { keys: ['Ctrl', 'Shift', 'T'], desc: 'Toggle theme (dark/light)' },
            ]
        }
    ];

    const style = document.createElement('style');
    style.textContent = `
    .shortcut-overlay{position:fixed;inset:0;z-index:9900;background:rgba(0,0,0,0.65);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.25s}
    .shortcut-overlay.active{opacity:1;visibility:visible}
    .shortcut-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:min(520px,90vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);transform:scale(0.95);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .shortcut-overlay.active .shortcut-modal{transform:scale(1)}
    .shortcut-header{display:flex;align-items:center;gap:10px;padding:18px 22px;border-bottom:1px solid var(--border)}
    .shortcut-header h3{font-size:1.05rem;font-weight:700;margin:0;flex:1}
    .shortcut-close{background:none;border:none;color:var(--text-tertiary);font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px}
    .shortcut-close:hover{background:var(--bg-hover);color:var(--text-primary)}
    .shortcut-body{flex:1;overflow-y:auto;padding:12px 18px 18px}
    .shortcut-group{margin-bottom:16px}
    .shortcut-group-title{font-size:0.78rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;display:flex;align-items:center;gap:6px}
    .shortcut-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:10px;transition:background 0.15s}
    .shortcut-row:hover{background:var(--bg-hover)}
    .shortcut-desc{font-size:0.82rem;color:var(--text-primary);flex:1}
    .shortcut-keys{display:flex;gap:4px;flex-shrink:0}
    .shortcut-key{background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary);padding:3px 10px;border-radius:7px;font-size:0.72rem;font-weight:600;font-family:var(--font-body);min-width:20px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.1)}
    .shortcut-plus{color:var(--text-tertiary);font-size:0.7rem;display:flex;align-items:center}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;

        const overlay = document.createElement('div');
        overlay.className = 'shortcut-overlay';
        overlay.id = 'shortcut-overlay';
        overlay.innerHTML = `
            <div class="shortcut-modal">
                <div class="shortcut-header"><h3>⌨️ Keyboard Shortcuts</h3><button class="shortcut-close" id="shortcut-close">✕</button></div>
                <div class="shortcut-body" id="shortcut-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.getElementById('shortcut-close').addEventListener('click', close);

        renderShortcuts();
        registerGlobalShortcuts();

        console.log('[Shortcuts] Initialized');
    }

    function renderShortcuts() {
        const body = document.getElementById('shortcut-body');
        if (!body) return;

        body.innerHTML = groups.map(g => `
            <div class="shortcut-group">
                <div class="shortcut-group-title">${g.icon} ${g.name}</div>
                ${g.shortcuts.map(s => `
                    <div class="shortcut-row">
                        <span class="shortcut-desc">${s.desc}</span>
                        <div class="shortcut-keys">
                            ${s.keys.map((k, i) => `<span class="shortcut-key">${k}</span>${i < s.keys.length - 1 ? '<span class="shortcut-plus">+</span>' : ''}`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    function registerGlobalShortcuts() {
        document.addEventListener('keydown', e => {
            const active = document.activeElement?.tagName;
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active);

            // `?` — show shortcuts (only if not typing)
            if (e.key === '?' && !isInput) {
                e.preventDefault();
                toggle();
                return;
            }

            // Ctrl+N — new chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (typeof Chat !== 'undefined') { Chat.newChat(); Router.go('chat'); }
                return;
            }

            // Ctrl+, — settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                if (typeof Settings !== 'undefined') Settings.open();
                return;
            }

            // Ctrl+Shift+E — export
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                if (typeof Chat !== 'undefined') Chat.exportChat();
                return;
            }

            // Ctrl+Shift+T — quick theme toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                const cur = document.documentElement.dataset.theme;
                if (typeof Themes !== 'undefined') {
                    Themes.applyTheme(cur === 'dark' ? 'light' : 'dark');
                    Toast.show(cur === 'dark' ? '☀️ Light mode' : '🌙 Dark mode', 'info');
                }
                return;
            }

            // Esc — close any open overlay
            if (e.key === 'Escape') {
                const overlays = document.querySelectorAll('.search-overlay.active, .tmpl-overlay.active, .shortcut-overlay.active, .theme-overlay.active, .modal-overlay.active, .social-share-overlay.active');
                overlays.forEach(o => o.classList.remove('active'));
            }
        });
    }

    function open() { document.getElementById('shortcut-overlay')?.classList.add('active'); }
    function close() { document.getElementById('shortcut-overlay')?.classList.remove('active'); }
    function toggle() {
        const overlay = document.getElementById('shortcut-overlay');
        if (overlay?.classList.contains('active')) close(); else open();
    }

    return { init, open, close, toggle };
})();
