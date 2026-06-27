/* NEXUS — Custom System Prompts (Phase 13)
   Save, switch, and manage custom system instructions per chat
*/
const SystemPrompts = (() => {
    let initialized = false;
    const STORAGE_KEY = 'nexus_system_prompts';
    const ACTIVE_KEY = 'nexus_active_prompt';

    const DEFAULTS = [
        { id: 'default', name: '🎯 Default', desc: 'Balanced AI assistant', prompt: 'You are Nexus, a helpful AI career and study assistant. Be concise, supportive, and actionable.', builtin: true },
        { id: 'tutor', name: '🧑‍🏫 Tutor', desc: 'Explains step by step', prompt: 'You are a patient tutor. Explain concepts step by step with examples. Ask follow-up questions to check understanding. Use simple language.', builtin: true },
        { id: 'coder', name: '💻 Code Expert', desc: 'Technical and precise', prompt: 'You are a senior software engineer. Write clean, efficient code with comments. Explain trade-offs. Follow best practices. Include error handling.', builtin: true },
        { id: 'interviewer', name: '🎤 Interviewer', desc: 'Mock interviews', prompt: 'You are an experienced tech interviewer. Ask one question at a time. Wait for the answer before providing feedback. Be constructive but honest.', builtin: true },
        { id: 'brainstorm', name: '💡 Brainstormer', desc: 'Creative and expansive', prompt: 'You are a creative brainstorming partner. Generate multiple ideas, think outside the box, build on suggestions, and explore unconventional approaches.', builtin: true },
        { id: 'concise', name: '⚡ Concise', desc: 'Short and direct', prompt: 'Be extremely concise. Answer in 1-3 sentences maximum. Use bullet points. No filler words. Get straight to the point.', builtin: true }
    ];

    const style = document.createElement('style');
    style.textContent = `
    .sp-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .sp-overlay.active{opacity:1;visibility:visible}
    .sp-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;width:min(480px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .sp-overlay.active .sp-modal{transform:scale(1)}
    .sp-header{display:flex;align-items:center;gap:10px;padding:18px 22px 14px;border-bottom:1px solid var(--border)}
    .sp-header h3{flex:1;font-size:1.05rem;font-weight:700}
    .sp-close{background:none;border:none;font-size:1.1rem;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;border-radius:6px}
    .sp-body{flex:1;overflow-y:auto;padding:12px 18px}
    .sp-item{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:12px;margin-bottom:6px;cursor:pointer;transition:all 0.15s}
    .sp-item:hover{border-color:var(--accent);background:var(--bg-hover)}
    .sp-item.active{border-color:var(--accent);background:var(--accent-alpha,rgba(74,108,247,0.06));box-shadow:0 0 0 2px var(--accent-alpha,rgba(74,108,247,0.15))}
    .sp-item-info{flex:1;min-width:0}
    .sp-item-name{font-size:0.85rem;font-weight:700;color:var(--text-primary)}
    .sp-item-desc{font-size:0.7rem;color:var(--text-tertiary);margin-top:2px}
    .sp-item-check{font-size:0.9rem;flex-shrink:0}
    .sp-item-del{background:none;border:none;cursor:pointer;font-size:0.75rem;color:var(--text-tertiary);padding:4px;border-radius:4px;flex-shrink:0}
    .sp-item-del:hover{color:#f7768e}
    .sp-divider{font-size:0.7rem;font-weight:700;color:var(--text-tertiary);margin:14px 0 8px;text-transform:uppercase;letter-spacing:0.5px}
    .sp-create{margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
    .sp-create-input{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);font-size:0.8rem;font-family:var(--font-body);outline:none;margin-bottom:6px}
    .sp-create-input:focus{border-color:var(--accent)}
    .sp-create-textarea{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-secondary);color:var(--text-primary);font-size:0.78rem;font-family:var(--font-body);outline:none;resize:vertical;min-height:70px;margin-bottom:8px}
    .sp-create-textarea:focus{border-color:var(--accent)}
    .sp-create-btn{width:100%;padding:9px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .sp-create-btn:hover{filter:brightness(1.1)}
    .sp-indicator{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:4px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:20px;font-size:0.68rem;color:var(--text-tertiary);z-index:100;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .sp-indicator.visible{display:flex;align-items:center;gap:6px}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createOverlay();
        createIndicator();
        console.log('[SystemPrompts] Initialized');
    }

    function getCustomPrompts() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    function saveCustomPrompts(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    function getActiveId() { return localStorage.getItem(ACTIVE_KEY) || 'default'; }
    function setActiveId(id) { localStorage.setItem(ACTIVE_KEY, id); updateIndicator(); }

    function getAllPrompts() { return [...DEFAULTS, ...getCustomPrompts()]; }

    function getActivePrompt() {
        const id = getActiveId();
        return getAllPrompts().find(p => p.id === id) || DEFAULTS[0];
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sp-overlay';
        overlay.id = 'sp-overlay';
        overlay.innerHTML = `
            <div class="sp-modal">
                <div class="sp-header">
                    <h3>🧠 System Prompts</h3>
                    <button class="sp-close" id="sp-close">✕</button>
                </div>
                <div class="sp-body" id="sp-body"></div>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('sp-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }

    function createIndicator() {
        const ind = document.createElement('div');
        ind.className = 'sp-indicator';
        ind.id = 'sp-indicator';
        document.body.appendChild(ind);
        updateIndicator();
    }

    function updateIndicator() {
        const ind = document.getElementById('sp-indicator');
        if (!ind) return;
        const active = getActivePrompt();
        if (active.id === 'default') {
            ind.classList.remove('visible');
        } else {
            ind.textContent = `🧠 ${active.name}`;
            ind.classList.add('visible');
        }
    }

    function render() {
        const body = document.getElementById('sp-body');
        if (!body) return;
        const activeId = getActiveId();
        const custom = getCustomPrompts();

        let html = '<div class="sp-divider">Built-in Prompts</div>';
        DEFAULTS.forEach(p => {
            html += `<div class="sp-item ${p.id === activeId ? 'active' : ''}" data-id="${p.id}">
                <div class="sp-item-info">
                    <div class="sp-item-name">${p.name}</div>
                    <div class="sp-item-desc">${p.desc}</div>
                </div>
                <span class="sp-item-check">${p.id === activeId ? '✓' : ''}</span>
            </div>`;
        });

        if (custom.length) {
            html += '<div class="sp-divider">Custom Prompts</div>';
            custom.forEach(p => {
                html += `<div class="sp-item ${p.id === activeId ? 'active' : ''}" data-id="${p.id}">
                    <div class="sp-item-info">
                        <div class="sp-item-name">${escHtml(p.name)}</div>
                        <div class="sp-item-desc">${escHtml(p.desc || p.prompt.substring(0, 60) + '...')}</div>
                    </div>
                    <span class="sp-item-check">${p.id === activeId ? '✓' : ''}</span>
                    <button class="sp-item-del" data-del="${p.id}" title="Delete">🗑️</button>
                </div>`;
            });
        }

        html += `<div class="sp-create">
            <input class="sp-create-input" id="sp-name-input" placeholder="Prompt name (e.g. Essay Writer)" maxlength="50">
            <textarea class="sp-create-textarea" id="sp-prompt-input" placeholder="System instructions..."></textarea>
            <button class="sp-create-btn" id="sp-create-btn">➕ Create Custom Prompt</button>
        </div>`;

        body.innerHTML = html;

        // Wire clicks
        body.querySelectorAll('.sp-item').forEach(item => {
            item.addEventListener('click', e => {
                if (e.target.closest('.sp-item-del')) return;
                setActiveId(item.dataset.id);
                Toast.show(`Switched to ${getAllPrompts().find(p => p.id === item.dataset.id)?.name || 'prompt'}`, 'success');
                render();
            });
        });

        body.querySelectorAll('.sp-item-del').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const prompts = getCustomPrompts().filter(p => p.id !== btn.dataset.del);
                saveCustomPrompts(prompts);
                if (getActiveId() === btn.dataset.del) setActiveId('default');
                render();
                Toast.show('Prompt deleted', 'info');
            });
        });

        document.getElementById('sp-create-btn')?.addEventListener('click', () => {
            const name = document.getElementById('sp-name-input')?.value.trim();
            const prompt = document.getElementById('sp-prompt-input')?.value.trim();
            if (!name || !prompt) { Toast.show('Fill both fields!', 'warning'); return; }
            const custom = getCustomPrompts();
            custom.push({ id: 'sp_' + Date.now(), name, desc: prompt.substring(0, 60) + '...', prompt });
            saveCustomPrompts(custom);
            Toast.show('✨ Prompt created!', 'success');
            render();
        });
    }

    function escHtml(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    function open() { document.getElementById('sp-overlay')?.classList.add('active'); render(); }
    function close() { document.getElementById('sp-overlay')?.classList.remove('active'); }

    return { init, open, close, getActivePrompt };
})();
