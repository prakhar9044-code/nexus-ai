/* NEXUS — Chat Search & Bookmarks (Phase 9)
   Ctrl+K search overlay, fuzzy match across all chats, ⭐ bookmarks
*/
const Search = (() => {
    let initialized = false;
    let bookmarks = JSON.parse(localStorage.getItem('nexus_bookmarks') || '[]');

    const style = document.createElement('style');
    style.textContent = `
    .search-overlay{position:fixed;inset:0;z-index:9800;background:rgba(0,0,0,0.6);backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding-top:min(15vh,120px);opacity:0;visibility:hidden;transition:all 0.25s ease}
    .search-overlay.active{opacity:1;visibility:visible}
    .search-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:min(560px,92vw);max-height:70vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);transform:translateY(-20px) scale(0.96);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .search-overlay.active .search-modal{transform:translateY(0) scale(1)}
    .search-input-wrap{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border)}
    .search-icon{color:var(--text-tertiary);font-size:1.2rem;flex-shrink:0}
    .search-input{flex:1;background:none;border:none;outline:none;font-size:1rem;font-family:var(--font-body);color:var(--text-primary)}
    .search-input::placeholder{color:var(--text-tertiary)}
    .search-tabs{display:flex;gap:2px;padding:8px 16px;border-bottom:1px solid var(--border)}
    .search-tab{padding:6px 14px;border:none;background:none;color:var(--text-tertiary);font-size:0.78rem;font-weight:600;border-radius:8px;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .search-tab:hover{color:var(--text-primary);background:var(--bg-hover)}
    .search-tab.active{color:var(--accent);background:var(--accent-alpha)}
    .search-results{flex:1;overflow-y:auto;padding:8px}
    .search-result{display:flex;gap:12px;padding:10px 14px;border-radius:12px;cursor:pointer;transition:all 0.15s;align-items:flex-start}
    .search-result:hover{background:var(--bg-hover)}
    .search-result-icon{font-size:1.1rem;padding-top:2px;flex-shrink:0}
    .search-result-content{flex:1;min-width:0}
    .search-result-title{font-size:0.85rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .search-result-preview{font-size:0.75rem;color:var(--text-tertiary);margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .search-result-meta{font-size:0.65rem;color:var(--text-tertiary);margin-top:4px;display:flex;gap:8px}
    .search-result mark{background:rgba(74,108,247,0.2);color:var(--accent);border-radius:2px;padding:0 2px}
    .search-empty{text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:0.85rem}
    .search-empty-icon{font-size:2.5rem;margin-bottom:8px}
    .search-hint{font-size:0.7rem;color:var(--text-tertiary);padding:8px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between}
    .search-hint kbd{background:var(--bg-secondary);border:1px solid var(--border);border-radius:4px;padding:1px 6px;font-size:0.65rem;font-family:var(--font-body)}
    .bookmark-btn{background:none;border:none;cursor:pointer;font-size:0.85rem;padding:3px 6px;border-radius:6px;transition:all 0.2s;opacity:0.5}
    .bookmark-btn:hover{opacity:1;transform:scale(1.2)}
    .bookmark-btn.bookmarked{opacity:1;color:#f59e0b}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.id = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-modal">
                <div class="search-input-wrap">
                    <span class="search-icon">🔍</span>
                    <input class="search-input" id="search-input" placeholder="Search messages... or type > for commands" autocomplete="off">
                </div>
                <div class="search-tabs">
                    <button class="search-tab active" data-tab="all">All</button>
                    <button class="search-tab" data-tab="messages">Messages</button>
                    <button class="search-tab" data-tab="bookmarks">⭐ Bookmarks</button>
                    <button class="search-tab" data-tab="commands">⚡ Commands</button>
                </div>
                <div class="search-results" id="search-results">
                    <div class="search-empty"><div class="search-empty-icon">🔍</div>Type to search across all conversations</div>
                </div>
                <div class="search-hint"><span><kbd>↑↓</kbd> Navigate <kbd>Enter</kbd> Open</span><span><kbd>Esc</kbd> Close</span></div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Events
        const input = document.getElementById('search-input');
        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => performSearch(input.value.trim()), 200);
        });

        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggle(); }
            if (e.key === 'Escape' && overlay.classList.contains('active')) close();
        });

        // Tabs
        overlay.querySelectorAll('.search-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                performSearch(input.value.trim());
            });
        });

        console.log('[Search] Initialized');
    }

    function open() {
        const overlay = document.getElementById('search-overlay');
        overlay?.classList.add('active');
        setTimeout(() => document.getElementById('search-input')?.focus(), 100);
    }

    function close() {
        document.getElementById('search-overlay')?.classList.remove('active');
        const input = document.getElementById('search-input');
        if (input) input.value = '';
    }

    function toggle() {
        const overlay = document.getElementById('search-overlay');
        if (overlay?.classList.contains('active')) close(); else open();
    }

    function performSearch(query) {
        const results = document.getElementById('search-results');
        const activeTab = document.querySelector('.search-tab.active')?.dataset.tab || 'all';

        if (activeTab === 'bookmarks') {
            renderBookmarks(query);
            return;
        }

        // Command palette: `>` prefix or Commands tab
        if (query.startsWith('>') || activeTab === 'commands') {
            renderCommands(query.startsWith('>') ? query.substring(1).trim() : query);
            return;
        }

        if (!query || query.length < 2) {
            results.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div>Type to search across all conversations</div>';
            return;
        }

        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const matches = [];
        const lowerQuery = query.toLowerCase();

        Object.entries(chats).forEach(([chatId, chat]) => {
            if (!chat.messages) return;
            // Search title
            if (chat.title?.toLowerCase().includes(lowerQuery)) {
                matches.push({ type: 'chat', chatId, title: chat.title, preview: `${chat.messages.length} messages`, time: chat.updated || chat.created });
            }
            // Search messages
            if (activeTab === 'all' || activeTab === 'messages') {
                chat.messages.forEach((msg, idx) => {
                    const text = msg.text || msg.content || '';
                    if (text.toLowerCase().includes(lowerQuery)) {
                        matches.push({
                            type: 'message', chatId, msgIdx: idx,
                            title: chat.title || 'Chat',
                            preview: text.substring(0, 200),
                            role: msg.role,
                            time: msg.time || chat.updated
                        });
                    }
                });
            }
        });

        if (!matches.length) {
            results.innerHTML = `<div class="search-empty"><div class="search-empty-icon">😔</div>No results for "${query}"</div>`;
            return;
        }

        // Limit and render
        results.innerHTML = matches.slice(0, 30).map(m => {
            const icon = m.type === 'chat' ? '💬' : m.role === 'user' ? '👤' : '🤖';
            const highlighted = highlightMatch(m.preview, query);
            const timeStr = m.time ? formatTime(m.time) : '';
            const isBookmarked = bookmarks.some(b => b.chatId === m.chatId && b.msgIdx === m.msgIdx);
            return `<div class="search-result" data-chat="${m.chatId}" data-msg="${m.msgIdx || ''}">
                <span class="search-result-icon">${icon}</span>
                <div class="search-result-content">
                    <div class="search-result-title">${m.title}</div>
                    <div class="search-result-preview">${highlighted}</div>
                    <div class="search-result-meta"><span>${m.type === 'chat' ? 'Chat' : m.role}</span>${timeStr ? `<span>${timeStr}</span>` : ''}</div>
                </div>
                ${m.type === 'message' ? `<button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-chat="${m.chatId}" data-msg="${m.msgIdx}" title="Bookmark">⭐</button>` : ''}
            </div>`;
        }).join('');

        // Click handlers
        results.querySelectorAll('.search-result').forEach(el => {
            el.addEventListener('click', e => {
                if (e.target.closest('.bookmark-btn')) return;
                const chatId = el.dataset.chat;
                close();
                if (typeof Chat !== 'undefined') {
                    // Load the chat
                    const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
                    if (chats[chatId]) {
                        localStorage.setItem('nexus_current_chat', chatId);
                        Chat.init();
                        Router.go('chat');
                    }
                }
            });
        });

        results.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                toggleBookmark(btn.dataset.chat, parseInt(btn.dataset.msg));
                btn.classList.toggle('bookmarked');
            });
        });
    }

    function renderBookmarks(query) {
        const results = document.getElementById('search-results');
        let filtered = bookmarks;
        if (query) {
            const lq = query.toLowerCase();
            filtered = bookmarks.filter(b => b.text?.toLowerCase().includes(lq) || b.chatTitle?.toLowerCase().includes(lq));
        }

        if (!filtered.length) {
            results.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⭐</div>No bookmarks yet. Star messages to save them here!</div>';
            return;
        }

        results.innerHTML = filtered.map(b => `
            <div class="search-result" data-chat="${b.chatId}" data-msg="${b.msgIdx}">
                <span class="search-result-icon">⭐</span>
                <div class="search-result-content">
                    <div class="search-result-title">${b.chatTitle || 'Chat'}</div>
                    <div class="search-result-preview">${b.text?.substring(0, 200) || ''}</div>
                    <div class="search-result-meta"><span>${b.role || 'message'}</span><span>${formatTime(b.time)}</span></div>
                </div>
                <button class="bookmark-btn bookmarked" data-chat="${b.chatId}" data-msg="${b.msgIdx}" title="Remove">⭐</button>
            </div>
        `).join('');

        results.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                toggleBookmark(btn.dataset.chat, parseInt(btn.dataset.msg));
                performSearch(query);
            });
        });
    }

    function toggleBookmark(chatId, msgIdx) {
        const idx = bookmarks.findIndex(b => b.chatId === chatId && b.msgIdx === msgIdx);
        if (idx >= 0) {
            bookmarks.splice(idx, 1);
        } else {
            const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
            const chat = chats[chatId];
            const msg = chat?.messages?.[msgIdx];
            if (msg) {
                bookmarks.push({
                    chatId, msgIdx,
                    chatTitle: chat.title,
                    text: msg.text || msg.content || '',
                    role: msg.role,
                    time: msg.time || new Date().toISOString()
                });
            }
        }
        localStorage.setItem('nexus_bookmarks', JSON.stringify(bookmarks));
    }

    function highlightMatch(text, query) {
        if (!query) return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
    }

    function formatTime(t) {
        try {
            const d = new Date(t);
            const now = new Date();
            const diff = now - d;
            if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch { return ''; }
    }

    function renderCommands(filter) {
        const results = document.getElementById('search-results');
        const commands = [
            { icon: '💬', name: 'New Chat', desc: 'Start a new conversation', action: () => { if (typeof Chat !== 'undefined') { Chat.newChat(); Router.go('chat'); } } },
            { icon: '⚙️', name: 'Settings', desc: 'Open settings panel', action: () => { if (typeof Settings !== 'undefined') Settings.open(); } },
            { icon: '🎨', name: 'Theme Gallery', desc: 'Change app theme', action: () => { if (typeof Themes !== 'undefined') Themes.open(); } },
            { icon: '🌙', name: 'Toggle Dark Mode', desc: 'Switch dark/light', action: () => { if (typeof Themes !== 'undefined') { const cur = document.documentElement.dataset.theme; Themes.applyTheme(cur === 'dark' ? 'light' : 'dark'); } } },
            { icon: '📝', name: 'Templates', desc: 'Open prompt templates', action: () => { if (typeof Templates !== 'undefined') Templates.open(); } },
            { icon: '📄', name: 'Export PDF', desc: 'Export chat as PDF', action: () => { if (typeof DocHelper !== 'undefined') DocHelper.printPDF(); } },
            { icon: '📤', name: 'Export Chat', desc: 'Export as text file', action: () => { if (typeof Chat !== 'undefined') Chat.exportChat(); } },
            { icon: '🗑️', name: 'Clear All Chats', desc: 'Delete all conversations', action: () => { if (confirm('Delete ALL chats?') && typeof Chat !== 'undefined') Chat.clearAllChats(); } },
            { icon: '⌨️', name: 'Keyboard Shortcuts', desc: 'View all shortcuts', action: () => { if (typeof Shortcuts !== 'undefined') Shortcuts.open(); } },
            { icon: '🧠', name: 'Memory Dashboard', desc: 'View stored memories', action: () => { Router.go('memory'); } },
        ];
        // Add persona commands
        if (typeof Personas !== 'undefined') {
            Object.values(Personas.getAll()).forEach(p => {
                commands.push({ icon: p.icon, name: `Persona: ${p.name}`, desc: p.desc, action: () => Personas.setPersona(p.id) });
            });
        }

        const lf = (filter || '').toLowerCase();
        const filtered = lf ? commands.filter(c => c.name.toLowerCase().includes(lf) || c.desc.toLowerCase().includes(lf)) : commands;

        if (!filtered.length) {
            results.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⚡</div>No commands match</div>';
            return;
        }

        results.innerHTML = filtered.map(c => `
            <div class="search-result command-result" data-cmd="${c.name}">
                <span class="search-result-icon">${c.icon}</span>
                <div class="search-result-content">
                    <div class="search-result-title">${c.name}</div>
                    <div class="search-result-preview">${c.desc}</div>
                </div>
                <span style="font-size:0.7rem;color:var(--text-tertiary)">Run ↵</span>
            </div>
        `).join('');

        const cmdActions = {};
        filtered.forEach(c => cmdActions[c.name] = c.action);

        results.querySelectorAll('.command-result').forEach(el => {
            el.addEventListener('click', () => {
                close();
                const fn = cmdActions[el.dataset.cmd];
                if (fn) fn();
            });
        });
    }

    return { init, open, close, toggle, toggleBookmark };
})();
