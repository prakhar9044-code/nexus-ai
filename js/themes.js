/* NEXUS — Theme Gallery (Phase 9)
   8 premium themes with CSS variable overrides, gallery modal, live preview
*/
const Themes = (() => {
    let initialized = false;

    const themes = [
        {
            id: 'light', name: 'Daylight', icon: '☀️', desc: 'Clean and bright',
            vars: { '--bg-primary': '#ffffff', '--bg-secondary': '#f8f9fb', '--bg-hover': '#f0f1f5', '--text-primary': '#1a1a2e', '--text-secondary': '#4a4a6a', '--text-tertiary': '#8888a8', '--border': '#e5e7eb', '--accent': null, '--msg-user': '#4a6cf7', '--msg-user-text': '#ffffff', '--msg-ai': '#f0f2f5', '--msg-ai-text': '#1a1a2e', '--shadow': 'rgba(0,0,0,0.08)' },
            dark: false
        },
        {
            id: 'dark', name: 'Midnight', icon: '🌙', desc: 'Easy on the eyes',
            vars: { '--bg-primary': '#0f0f1a', '--bg-secondary': '#1a1a2e', '--bg-hover': '#252540', '--text-primary': '#e8e8f0', '--text-secondary': '#a0a0c0', '--text-tertiary': '#6a6a8a', '--border': '#2a2a45', '--accent': null, '--msg-user': null, '--msg-user-text': '#ffffff', '--msg-ai': '#1a1a2e', '--msg-ai-text': '#e8e8f0', '--shadow': 'rgba(0,0,0,0.4)' },
            dark: true
        },
        {
            id: 'nebula', name: 'Nebula', icon: '🌌', desc: 'Deep purple cosmos',
            vars: { '--bg-primary': '#120b20', '--bg-secondary': '#1e1435', '--bg-hover': '#2a1e48', '--text-primary': '#e8dff5', '--text-secondary': '#b8a8d8', '--text-tertiary': '#7a6a9a', '--border': '#2e2250', '--accent': '#8b5cf6', '--msg-user': '#8b5cf6', '--msg-user-text': '#ffffff', '--msg-ai': '#1e1435', '--msg-ai-text': '#e8dff5', '--shadow': 'rgba(80,40,160,0.3)' },
            dark: true
        },
        {
            id: 'ocean', name: 'Ocean', icon: '🌊', desc: 'Calm deep waters',
            vars: { '--bg-primary': '#0a1628', '--bg-secondary': '#0f2035', '--bg-hover': '#162a42', '--text-primary': '#d5e8f8', '--text-secondary': '#8ab4d8', '--text-tertiary': '#5a84a8', '--border': '#1a3048', '--accent': '#06b6d4', '--msg-user': '#0891b2', '--msg-user-text': '#ffffff', '--msg-ai': '#0f2035', '--msg-ai-text': '#d5e8f8', '--shadow': 'rgba(6,100,150,0.3)' },
            dark: true
        },
        {
            id: 'forest', name: 'Forest', icon: '🌿', desc: 'Natural earth tones',
            vars: { '--bg-primary': '#0c1a0e', '--bg-secondary': '#142218', '--bg-hover': '#1e2e22', '--text-primary': '#d8ead0', '--text-secondary': '#98b888', '--text-tertiary': '#5a7a4a', '--border': '#1e3020', '--accent': '#22c55e', '--msg-user': '#16a34a', '--msg-user-text': '#ffffff', '--msg-ai': '#142218', '--msg-ai-text': '#d8ead0', '--shadow': 'rgba(20,80,30,0.3)' },
            dark: true
        },
        {
            id: 'ember', name: 'Ember', icon: '🔥', desc: 'Warm charcoal glow',
            vars: { '--bg-primary': '#1a0e08', '--bg-secondary': '#261812', '--bg-hover': '#32221a', '--text-primary': '#f0ddd0', '--text-secondary': '#c8a888', '--text-tertiary': '#8a6a4a', '--border': '#382218', '--accent': '#f97316', '--msg-user': '#ea580c', '--msg-user-text': '#ffffff', '--msg-ai': '#261812', '--msg-ai-text': '#f0ddd0', '--shadow': 'rgba(150,60,10,0.3)' },
            dark: true
        },
        {
            id: 'candy', name: 'Candy', icon: '🍬', desc: 'Soft pastel delight',
            vars: { '--bg-primary': '#fff5f9', '--bg-secondary': '#fce8f0', '--bg-hover': '#f8d8e8', '--text-primary': '#3a2030', '--text-secondary': '#6a4058', '--text-tertiary': '#9a7088', '--border': '#f0c8d8', '--accent': '#ec4899', '--msg-user': '#ec4899', '--msg-user-text': '#ffffff', '--msg-ai': '#fce8f0', '--msg-ai-text': '#3a2030', '--shadow': 'rgba(200,80,130,0.15)' },
            dark: false
        },
        {
            id: 'hacker', name: 'Hacker', icon: '⚡', desc: 'Matrix terminal vibes',
            vars: { '--bg-primary': '#000000', '--bg-secondary': '#0a0a0a', '--bg-hover': '#141414', '--text-primary': '#00ff41', '--text-secondary': '#00cc33', '--text-tertiary': '#008822', '--border': '#1a2a1a', '--accent': '#00ff41', '--msg-user': '#00cc33', '--msg-user-text': '#000000', '--msg-ai': '#0a0a0a', '--msg-ai-text': '#00ff41', '--shadow': 'rgba(0,255,65,0.15)' },
            dark: true
        }
    ];

    const style = document.createElement('style');
    style.textContent = `
    .theme-overlay{position:fixed;inset:0;z-index:9600;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.25s}
    .theme-overlay.active{opacity:1;visibility:visible}
    .theme-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:min(640px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);transform:scale(0.96);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .theme-overlay.active .theme-modal{transform:scale(1)}
    .theme-header{display:flex;align-items:center;gap:10px;padding:18px 22px;border-bottom:1px solid var(--border)}
    .theme-header h3{font-size:1.05rem;font-weight:700;margin:0;flex:1}
    .theme-close{background:none;border:none;color:var(--text-tertiary);font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px}
    .theme-close:hover{background:var(--bg-hover);color:var(--text-primary)}
    .theme-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:18px;overflow-y:auto}
    .theme-card{border:2px solid var(--border);border-radius:14px;padding:14px;cursor:pointer;transition:all 0.25s;position:relative;overflow:hidden}
    .theme-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--shadow)}
    .theme-card.active{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-alpha, rgba(74,108,247,0.2))}
    .theme-card-preview{display:flex;gap:4px;margin-bottom:10px;height:32px;border-radius:8px;overflow:hidden}
    .theme-card-swatch{flex:1;border-radius:4px}
    .theme-card-name{font-size:0.88rem;font-weight:700;display:flex;align-items:center;gap:6px}
    .theme-card-desc{font-size:0.72rem;color:var(--text-tertiary);margin-top:2px}
    .theme-card-badge{position:absolute;top:8px;right:8px;font-size:0.65rem;background:var(--accent);color:#fff;padding:2px 8px;border-radius:6px;font-weight:600}
    @media(max-width:500px){.theme-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;

        const overlay = document.createElement('div');
        overlay.className = 'theme-overlay';
        overlay.id = 'theme-overlay';
        overlay.innerHTML = `
            <div class="theme-modal">
                <div class="theme-header"><h3>🎨 Theme Gallery</h3><button class="theme-close" id="theme-close">✕</button></div>
                <div class="theme-grid" id="theme-grid"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.getElementById('theme-close').addEventListener('click', close);

        renderGallery();
        // Apply saved theme on load
        const saved = localStorage.getItem('nexus_theme_id') || 'dark';
        applyTheme(saved);

        console.log('[Themes] Initialized');
    }

    function renderGallery() {
        const grid = document.getElementById('theme-grid');
        if (!grid) return;
        const current = localStorage.getItem('nexus_theme_id') || 'dark';

        grid.innerHTML = themes.map(t => `
            <div class="theme-card ${t.id === current ? 'active' : ''}" data-theme="${t.id}" style="background:${t.vars['--bg-primary']};border-color:${t.id === current ? (t.vars['--accent'] || 'var(--accent)') : t.vars['--border']}">
                <div class="theme-card-preview">
                    <div class="theme-card-swatch" style="background:${t.vars['--bg-secondary']}"></div>
                    <div class="theme-card-swatch" style="background:${t.vars['--accent'] || '#4a6cf7'}"></div>
                    <div class="theme-card-swatch" style="background:${t.vars['--msg-user'] || '#4a6cf7'}"></div>
                    <div class="theme-card-swatch" style="background:${t.vars['--text-primary']}"></div>
                </div>
                <div class="theme-card-name" style="color:${t.vars['--text-primary']}">${t.icon} ${t.name}</div>
                <div class="theme-card-desc" style="color:${t.vars['--text-tertiary']}">${t.desc}</div>
                ${t.id === current ? '<div class="theme-card-badge">Active</div>' : ''}
            </div>
        `).join('');

        grid.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.theme;
                applyTheme(id);
                renderGallery();
                Toast.show(`🎨 Theme: ${themes.find(t => t.id === id)?.name || id}`, 'success');
            });
        });
    }

    function applyTheme(themeId) {
        const theme = themes.find(t => t.id === themeId);
        if (!theme) return;

        // Set CSS variables
        const root = document.documentElement;
        Object.entries(theme.vars).forEach(([key, value]) => {
            if (value !== null) root.style.setProperty(key, value);
        });

        // Set data-theme for existing dark/light conditional styles
        root.dataset.theme = theme.dark ? 'dark' : 'light';

        // Update accent-derived variables
        const accent = theme.vars['--accent'] || localStorage.getItem('nexus_accent') || '#4a6cf7';
        root.style.setProperty('--accent', accent);
        root.style.setProperty('--accent-subtle', accent + '14');
        root.style.setProperty('--accent-border', accent + '33');
        root.style.setProperty('--accent-alpha', accent + '22');
        root.style.setProperty('--border-focus', accent);

        // Save
        localStorage.setItem('nexus_theme_id', themeId);
        localStorage.setItem('nexus_theme', theme.dark ? 'dark' : 'light');

        // Update theme toggle in settings
        const toggle = document.getElementById('theme-toggle');
        if (toggle) toggle.checked = theme.dark;
    }

    function open() {
        renderGallery();
        document.getElementById('theme-overlay')?.classList.add('active');
    }
    function close() { document.getElementById('theme-overlay')?.classList.remove('active'); }
    function toggle() {
        const overlay = document.getElementById('theme-overlay');
        if (overlay?.classList.contains('active')) close(); else open();
    }

    return { init, open, close, toggle, applyTheme };
})();
