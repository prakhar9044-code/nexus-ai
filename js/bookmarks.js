/* NEXUS — Chat Bookmarks (Phase 13)
   Bookmark important messages for quick reference
*/
const Bookmarks = (() => {
    let initialized = false;
    const STORAGE_KEY = 'nexus_bookmarks';

    function getBookmarks() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    function saveBookmarks(b) { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); }

    const style = document.createElement('style');
    style.textContent = `
    .bm-btn{position:absolute;top:6px;left:-28px;background:none;border:none;cursor:pointer;font-size:0.85rem;opacity:0;transition:all 0.15s;padding:2px;border-radius:4px;color:var(--text-tertiary)}
    .message:hover .bm-btn{opacity:0.6}
    .bm-btn:hover{opacity:1!important;transform:scale(1.2)}
    .bm-btn.bookmarked{opacity:1!important;color:#f59e0b}
    .bm-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .bm-overlay.active{opacity:1;visibility:visible}
    .bm-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;width:min(500px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .bm-overlay.active .bm-modal{transform:scale(1)}
    .bm-header{display:flex;align-items:center;gap:10px;padding:18px 22px 14px;border-bottom:1px solid var(--border)}
    .bm-header h3{flex:1;font-size:1.05rem;font-weight:700;display:flex;align-items:center;gap:8px}
    .bm-close{background:none;border:none;font-size:1.1rem;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;border-radius:6px}
    .bm-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .bm-body{flex:1;overflow-y:auto;padding:12px 18px}
    .bm-empty{text-align:center;padding:40px 20px;color:var(--text-tertiary)}
    .bm-empty-icon{font-size:2.5rem;margin-bottom:8px}
    .bm-item{padding:12px 14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;transition:all 0.15s;cursor:pointer}
    .bm-item:hover{border-color:var(--accent);background:var(--bg-hover)}
    .bm-item-header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
    .bm-item-role{font-size:0.65rem;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:6px;letter-spacing:0.5px}
    .bm-item-role.user{background:var(--accent-alpha,rgba(74,108,247,0.1));color:var(--accent)}
    .bm-item-role.ai{background:rgba(158,206,106,0.1);color:#9ece6a}
    .bm-item-time{font-size:0.65rem;color:var(--text-tertiary);margin-left:auto}
    .bm-item-del{background:none;border:none;font-size:0.75rem;cursor:pointer;color:var(--text-tertiary);padding:2px;border-radius:4px}
    .bm-item-del:hover{color:#f7768e}
    .bm-item-text{font-size:0.8rem;color:var(--text-secondary);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .bm-item-chat{font-size:0.65rem;color:var(--text-tertiary);margin-top:6px;display:flex;align-items:center;gap:4px}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createOverlay();
        observeMessages();
        console.log('[Bookmarks] Initialized');
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'bm-overlay';
        overlay.id = 'bm-overlay';
        overlay.innerHTML = `
            <div class="bm-modal">
                <div class="bm-header">
                    <h3>🔖 Bookmarks</h3>
                    <button class="bm-close" id="bm-close">✕</button>
                </div>
                <div class="bm-body" id="bm-body"></div>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('bm-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }

    function observeMessages() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('message')) {
                        injectBookmarkBtn(node);
                    }
                });
            });
        });
        setTimeout(() => {
            const area = document.querySelector('.messages-area');
            if (area) {
                observer.observe(area, { childList: true });
                area.querySelectorAll('.message').forEach(msg => injectBookmarkBtn(msg));
            }
        }, 1200);
    }

    function injectBookmarkBtn(msgEl) {
        if (msgEl.querySelector('.bm-btn')) return;
        msgEl.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'bm-btn';
        btn.title = 'Bookmark';
        btn.textContent = '🔖';

        // Check if already bookmarked
        const msgId = getMsgId(msgEl);
        if (isBookmarked(msgId)) btn.classList.add('bookmarked');

        btn.addEventListener('click', e => {
            e.stopPropagation();
            toggleBookmark(msgEl, btn);
        });
        msgEl.appendChild(btn);
    }

    function getMsgId(msgEl) {
        const area = msgEl.closest('.messages-area');
        if (!area) return 'msg_0';
        const allMsgs = Array.from(area.querySelectorAll('.message'));
        const chatId = typeof Chat !== 'undefined' ? Chat.getCurrentChatId() : 'default';
        return `${chatId}_msg_${allMsgs.indexOf(msgEl)}`;
    }

    function isBookmarked(msgId) {
        return getBookmarks().some(b => b.msgId === msgId);
    }

    function toggleBookmark(msgEl, btn) {
        const msgId = getMsgId(msgEl);
        const bookmarks = getBookmarks();
        const existing = bookmarks.findIndex(b => b.msgId === msgId);

        if (existing >= 0) {
            bookmarks.splice(existing, 1);
            btn.classList.remove('bookmarked');
            if (typeof Toast !== 'undefined') Toast.show('Bookmark removed', 'info');
        } else {
            const text = msgEl.querySelector('.message-bubble')?.textContent || '';
            const isUser = msgEl.classList.contains('user-message');
            const chatId = typeof Chat !== 'undefined' ? Chat.getCurrentChatId() : 'default';
            const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
            const chatTitle = chats[chatId]?.title || 'Chat';

            bookmarks.unshift({
                msgId,
                chatId,
                chatTitle,
                text: text.substring(0, 500),
                role: isUser ? 'user' : 'ai',
                time: Date.now()
            });
            btn.classList.add('bookmarked');
            if (typeof Toast !== 'undefined') Toast.show('🔖 Bookmarked!', 'success');
        }
        saveBookmarks(bookmarks);
    }

    function render() {
        const body = document.getElementById('bm-body');
        if (!body) return;
        const bookmarks = getBookmarks();

        if (!bookmarks.length) {
            body.innerHTML = '<div class="bm-empty"><div class="bm-empty-icon">🔖</div><p>No bookmarks yet</p><p style="font-size:0.75rem">Click the 🔖 icon on any message to bookmark it.</p></div>';
            return;
        }

        body.innerHTML = bookmarks.map((b, i) => `
            <div class="bm-item" data-idx="${i}">
                <div class="bm-item-header">
                    <span class="bm-item-role ${b.role}">${b.role === 'user' ? '👤 You' : '🤖 AI'}</span>
                    <span class="bm-item-time">${new Date(b.time).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    <button class="bm-item-del" data-del="${i}" title="Remove">✕</button>
                </div>
                <div class="bm-item-text">${escHtml(b.text)}</div>
                <div class="bm-item-chat">💬 ${escHtml(b.chatTitle)}</div>
            </div>
        `).join('');

        body.querySelectorAll('.bm-item-del').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.del);
                const bm = getBookmarks();
                bm.splice(idx, 1);
                saveBookmarks(bm);
                render();
                Toast.show('Bookmark removed', 'info');
            });
        });
    }

    function escHtml(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    function open() { document.getElementById('bm-overlay')?.classList.add('active'); render(); }
    function close() { document.getElementById('bm-overlay')?.classList.remove('active'); }

    return { init, open, close };
})();
