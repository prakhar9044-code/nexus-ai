/* NEXUS — Quick Notes / Scratchpad (Phase 11)
   Slide-out notes panel with auto-save, multiple notes, markdown
*/
const Notes = (() => {
    let initialized = false;
    let notes = JSON.parse(localStorage.getItem('nexus_notes') || 'null') || [
        { id: 'n_default', title: 'Quick Notes', content: '', updated: Date.now() }
    ];
    let activeNoteId = notes[0]?.id;
    let saveTimer = null;

    const style = document.createElement('style');
    style.textContent = `
    .notes-panel{position:fixed;top:0;right:-380px;width:360px;max-width:90vw;height:100vh;background:var(--bg-primary);border-left:1px solid var(--border);z-index:9500;display:flex;flex-direction:column;transition:right 0.3s cubic-bezier(0.4,0,0.2,1);box-shadow:-8px 0 30px rgba(0,0,0,0.2)}
    .notes-panel.open{right:0}
    .notes-header{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--border)}
    .notes-header-title{font-size:0.9rem;font-weight:700;flex:1;display:flex;align-items:center;gap:6px}
    .notes-close{background:none;border:none;font-size:1.1rem;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.15s}
    .notes-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .notes-tabs{display:flex;gap:2px;padding:6px 12px;border-bottom:1px solid var(--border);overflow-x:auto;flex-shrink:0}
    .notes-tab{padding:5px 12px;border:1px solid transparent;border-radius:8px;background:none;color:var(--text-tertiary);font-size:0.72rem;font-weight:600;cursor:pointer;font-family:var(--font-body);white-space:nowrap;transition:all 0.15s}
    .notes-tab:hover{color:var(--text-primary);background:var(--bg-hover)}
    .notes-tab.active{color:var(--accent);background:var(--accent-alpha, rgba(74,108,247,0.08));border-color:var(--accent)}
    .notes-tab-add{color:var(--text-tertiary);font-size:0.85rem;padding:5px 10px}
    .notes-body{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .notes-title-input{border:none;background:none;font-size:0.88rem;font-weight:700;color:var(--text-primary);padding:12px 16px 4px;font-family:var(--font-body);outline:none;width:100%}
    .notes-textarea{flex:1;border:none;background:none;resize:none;padding:8px 16px;font-size:0.82rem;color:var(--text-primary);font-family:var(--font-body);line-height:1.7;outline:none}
    .notes-textarea::placeholder{color:var(--text-tertiary)}
    .notes-footer{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid var(--border);font-size:0.65rem;color:var(--text-tertiary)}
    .notes-footer-actions{display:flex;gap:4px}
    .notes-footer-btn{background:none;border:1px solid var(--border);color:var(--text-tertiary);font-size:0.68rem;padding:3px 10px;border-radius:6px;cursor:pointer;font-family:var(--font-body);transition:all 0.15s}
    .notes-footer-btn:hover{color:var(--accent);border-color:var(--accent)}
    .notes-saved{color:var(--accent);opacity:0;transition:opacity 0.3s}
    .notes-saved.show{opacity:1}
    .notes-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:9499;display:none}
    .notes-overlay.active{display:block}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createPanel();
        console.log('[Notes] Initialized');
    }

    function createPanel() {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'notes-overlay';
        overlay.id = 'notes-overlay';
        overlay.addEventListener('click', close);
        document.body.appendChild(overlay);

        // Panel
        const panel = document.createElement('div');
        panel.className = 'notes-panel';
        panel.id = 'notes-panel';
        panel.innerHTML = `
            <div class="notes-header">
                <div class="notes-header-title">📝 Notes</div>
                <span class="notes-saved" id="notes-saved">✓ Saved</span>
                <button class="notes-close" id="notes-close">✕</button>
            </div>
            <div class="notes-tabs" id="notes-tabs"></div>
            <div class="notes-body">
                <input class="notes-title-input" id="notes-title" placeholder="Note title..." maxlength="50">
                <textarea class="notes-textarea" id="notes-textarea" placeholder="Start writing...\n\nTips:\n• **bold** *italic*\n• - bullet points\n• Auto-saves every 2 seconds"></textarea>
            </div>
            <div class="notes-footer">
                <span id="notes-count">0 words</span>
                <div class="notes-footer-actions">
                    <button class="notes-footer-btn" id="notes-copy">📋 Copy</button>
                    <button class="notes-footer-btn" id="notes-delete" style="color:#ef4444">🗑️ Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Events
        document.getElementById('notes-close').addEventListener('click', close);
        document.getElementById('notes-copy').addEventListener('click', copyNote);
        document.getElementById('notes-delete').addEventListener('click', deleteNote);

        const textarea = document.getElementById('notes-textarea');
        const titleInput = document.getElementById('notes-title');

        textarea.addEventListener('input', () => { scheduleSave(); updateCount(); });
        titleInput.addEventListener('input', scheduleSave);

        renderTabs();
        loadNote(activeNoteId);
    }

    function renderTabs() {
        const tabsEl = document.getElementById('notes-tabs');
        if (!tabsEl) return;
        tabsEl.innerHTML = notes.map(n =>
            `<button class="notes-tab ${n.id === activeNoteId ? 'active' : ''}" data-id="${n.id}">${n.title || 'Untitled'}</button>`
        ).join('') + `<button class="notes-tab notes-tab-add" id="notes-add-tab">+</button>`;

        tabsEl.querySelectorAll('.notes-tab:not(.notes-tab-add)').forEach(tab => {
            tab.addEventListener('click', () => {
                saveCurrentNote();
                activeNoteId = tab.dataset.id;
                loadNote(activeNoteId);
                renderTabs();
            });
        });

        document.getElementById('notes-add-tab')?.addEventListener('click', addNote);
    }

    function loadNote(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        const textarea = document.getElementById('notes-textarea');
        const titleInput = document.getElementById('notes-title');
        if (textarea) textarea.value = note.content || '';
        if (titleInput) titleInput.value = note.title || '';
        updateCount();
    }

    function saveCurrentNote() {
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;
        const textarea = document.getElementById('notes-textarea');
        const titleInput = document.getElementById('notes-title');
        if (textarea) note.content = textarea.value;
        if (titleInput) note.title = titleInput.value || 'Untitled';
        note.updated = Date.now();
        save();
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveCurrentNote();
            renderTabs();
            // Show saved indicator
            const saved = document.getElementById('notes-saved');
            if (saved) {
                saved.classList.add('show');
                setTimeout(() => saved.classList.remove('show'), 1500);
            }
        }, 2000);
    }

    function addNote() {
        saveCurrentNote();
        const newNote = { id: 'n_' + Date.now(), title: 'New Note', content: '', updated: Date.now() };
        notes.push(newNote);
        activeNoteId = newNote.id;
        save();
        renderTabs();
        loadNote(activeNoteId);
        document.getElementById('notes-title')?.focus();
    }

    function deleteNote() {
        if (notes.length <= 1) { Toast.show('Can\'t delete the last note', 'warning'); return; }
        if (!confirm('Delete this note?')) return;
        notes = notes.filter(n => n.id !== activeNoteId);
        activeNoteId = notes[0]?.id;
        save();
        renderTabs();
        loadNote(activeNoteId);
        Toast.show('Note deleted', 'info');
    }

    function copyNote() {
        const textarea = document.getElementById('notes-textarea');
        if (textarea && textarea.value) {
            navigator.clipboard.writeText(textarea.value).then(() => {
                Toast.show('📋 Copied to clipboard!', 'success');
            }).catch(() => {
                textarea.select();
                document.execCommand('copy');
                Toast.show('📋 Copied!', 'success');
            });
        }
    }

    function updateCount() {
        const textarea = document.getElementById('notes-textarea');
        const count = document.getElementById('notes-count');
        if (textarea && count) {
            const text = textarea.value.trim();
            const words = text ? text.split(/\s+/).length : 0;
            const chars = textarea.value.length;
            count.textContent = `${words} words · ${chars} chars`;
        }
    }

    function save() {
        localStorage.setItem('nexus_notes', JSON.stringify(notes));
    }

    function open() {
        document.getElementById('notes-panel')?.classList.add('open');
        document.getElementById('notes-overlay')?.classList.add('active');
    }

    function close() {
        saveCurrentNote();
        document.getElementById('notes-panel')?.classList.remove('open');
        document.getElementById('notes-overlay')?.classList.remove('active');
    }

    function toggle() {
        const panel = document.getElementById('notes-panel');
        if (panel?.classList.contains('open')) close(); else open();
    }

    // Save AI response as a note
    function saveFromChat(text) {
        const newNote = { id: 'n_' + Date.now(), title: 'From Chat', content: text.substring(0, 5000), updated: Date.now() };
        notes.push(newNote);
        save();
        Toast.show('📝 Saved to Notes!', 'success');
    }

    return { init, open, close, toggle, saveFromChat };
})();
