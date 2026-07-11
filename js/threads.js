/* ============================================
   NEXUS — Chat Threads & Branching System
   Phase 14.1: Fork conversations, explore alternate paths
   ============================================ */
const Threads = (() => {
    const STORAGE_KEY = 'nexus_threads';

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
    .thread-branch-btn{background:none;border:none;cursor:pointer;font-size:0.75rem;padding:3px 8px;border-radius:6px;transition:all 0.2s;opacity:0;color:var(--text-tertiary);display:inline-flex;align-items:center;gap:4px}
    .message:hover .thread-branch-btn{opacity:0.7}
    .thread-branch-btn:hover{opacity:1!important;color:var(--accent);background:var(--bg-hover)}
    .thread-branch-btn svg{width:14px;height:14px}
    .thread-indicator{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg-hover);border:1px solid var(--border);border-radius:var(--radius-full);font-size:0.7rem;color:var(--text-secondary);margin-bottom:12px;cursor:pointer;transition:all 0.2s}
    .thread-indicator:hover{border-color:var(--accent);color:var(--accent)}
    .thread-indicator svg{width:12px;height:12px}
    .thread-panel{position:fixed;top:0;right:-380px;width:360px;max-width:90vw;height:100vh;height:100dvh;background:var(--bg-primary);border-left:1px solid var(--border);z-index:9550;display:flex;flex-direction:column;transition:right 0.3s cubic-bezier(0.4,0,0.2,1);box-shadow:-8px 0 30px rgba(0,0,0,0.2)}
    .thread-panel.open{right:0}
    .thread-panel-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .thread-panel-header h3{font-size:0.95rem;font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .thread-panel-close{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:6px;border-radius:8px;transition:all 0.2s}
    .thread-panel-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .thread-list{flex:1;overflow-y:auto;padding:12px}
    .thread-item{padding:10px 14px;border-radius:10px;cursor:pointer;transition:all 0.2s;margin-bottom:4px;border:1px solid transparent}
    .thread-item:hover{background:var(--bg-hover);border-color:var(--border)}
    .thread-item.active{background:var(--bg-active);border-color:var(--accent)}
    .thread-item-title{font-size:0.82rem;font-weight:500;color:var(--text-primary);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .thread-item-meta{font-size:0.68rem;color:var(--text-tertiary);display:flex;align-items:center;gap:8px}
    .thread-item-badge{font-size:0.6rem;padding:1px 6px;border-radius:8px;background:var(--accent);color:#fff;font-weight:600}
    .thread-tree-line{width:2px;height:12px;background:var(--border);margin-left:18px}
    .thread-back-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;margin:8px 12px;background:var(--bg-hover);border:1px solid var(--border);border-radius:8px;cursor:pointer;color:var(--text-secondary);font-size:0.78rem;transition:all 0.2s}
    .thread-back-btn:hover{border-color:var(--accent);color:var(--accent)}
    .thread-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:9549;display:none}
    .thread-overlay.active{display:block}
    @media(max-width:768px){.thread-panel{width:100vw;max-width:100vw}}
    `;
    document.head.appendChild(style);

    let threads = {};
    let currentThreadId = null;
    let panelEl = null;
    let overlayEl = null;

    function init() {
        threads = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        createPanel();
        observeMessages();
        console.log('[Threads] Initialized');
    }

    function createPanel() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'thread-overlay';
        overlayEl.addEventListener('click', closePanel);
        document.body.appendChild(overlayEl);

        panelEl = document.createElement('div');
        panelEl.className = 'thread-panel';
        panelEl.innerHTML = `
            <div class="thread-panel-header">
                <h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M6 3v12"/><path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M18 9c0 4-4 6-12 6"/></svg> Threads</h3>
                <button class="thread-panel-close" title="Close">✕</button>
            </div>
            <div class="thread-list"></div>
        `;
        panelEl.querySelector('.thread-panel-close').addEventListener('click', closePanel);
        document.body.appendChild(panelEl);
    }

    function observeMessages() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('message')) {
                        addBranchButton(node);
                    }
                    if (node.nodeType === 1) {
                        node.querySelectorAll?.('.message')?.forEach(addBranchButton);
                    }
                });
            });
        });
        const msgArea = document.querySelector('.messages-area');
        if (msgArea) {
            observer.observe(msgArea, { childList: true, subtree: true });
            msgArea.querySelectorAll('.message').forEach(addBranchButton);
        }
    }

    function addBranchButton(msgEl) {
        if (msgEl.querySelector('.thread-branch-btn')) return;
        const actions = msgEl.querySelector('.message-actions');
        if (!actions) return;

        const btn = document.createElement('button');
        btn.className = 'thread-branch-btn';
        btn.title = 'Branch conversation from here';
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9c0 4-4 6-12 6"/></svg> Branch`;
        btn.addEventListener('click', () => branchFromMessage(msgEl));
        actions.appendChild(btn);
    }

    function branchFromMessage(msgEl) {
        const messages = document.querySelectorAll('.messages-area .message');
        const msgIndex = Array.from(messages).indexOf(msgEl);
        if (msgIndex < 0) return;

        // Collect messages up to this point
        const branchedMessages = [];
        for (let i = 0; i <= msgIndex; i++) {
            const m = messages[i];
            const role = m.classList.contains('user-message') ? 'user' : 'nexus';
            const text = m.querySelector('.message-bubble')?.textContent?.trim() || '';
            if (text) branchedMessages.push({ role, text, time: Date.now() });
        }

        // Get current chat ID
        const parentChatId = (typeof Chat !== 'undefined' && Chat.getCurrentChatId) ? Chat.getCurrentChatId() : 'main';
        const threadId = 'thread_' + Date.now();
        const firstUserMsg = branchedMessages.find(m => m.role === 'user')?.text || 'Branch';
        const title = '🔀 ' + firstUserMsg.substring(0, 40) + (firstUserMsg.length > 40 ? '...' : '');

        threads[threadId] = {
            id: threadId,
            parentChatId,
            parentMsgIndex: msgIndex,
            title,
            messages: branchedMessages,
            createdAt: Date.now()
        };
        saveThreads();

        // Create a new chat with the branched messages
        if (typeof Chat !== 'undefined') {
            Chat.newChat();
            const input = document.getElementById('chat-input');
            if (input) {
                input.value = `Continue from: "${firstUserMsg.substring(0, 60)}"`;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        if (typeof Toast !== 'undefined') Toast.show('🔀 Conversation branched!', 'success');
        currentThreadId = threadId;
    }

    function openPanel() {
        renderThreadList();
        panelEl?.classList.add('open');
        overlayEl?.classList.add('active');
    }

    function closePanel() {
        panelEl?.classList.remove('open');
        overlayEl?.classList.remove('active');
    }

    function renderThreadList() {
        const list = panelEl?.querySelector('.thread-list');
        if (!list) return;

        const entries = Object.values(threads).sort((a, b) => b.createdAt - a.createdAt);
        if (!entries.length) {
            list.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-tertiary)">
                <div style="font-size:2rem;margin-bottom:12px">🔀</div>
                <div style="font-size:0.85rem;font-weight:500;margin-bottom:4px">No branches yet</div>
                <div style="font-size:0.75rem">Click "Branch" on any message to create one</div>
            </div>`;
            return;
        }

        list.innerHTML = entries.map(t => {
            const date = new Date(t.createdAt);
            const timeStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const msgCount = t.messages?.length || 0;
            const isActive = t.id === currentThreadId;
            return `
                <div class="thread-item${isActive ? ' active' : ''}" data-id="${t.id}">
                    <div class="thread-item-title">${t.title}</div>
                    <div class="thread-item-meta">
                        <span>${timeStr}</span>
                        <span>${msgCount} msgs</span>
                        ${isActive ? '<span class="thread-item-badge">ACTIVE</span>' : ''}
                    </div>
                </div>
            `;
        }).join('<div class="thread-tree-line"></div>');

        list.querySelectorAll('.thread-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                if (typeof Toast !== 'undefined') Toast.show(`📌 Thread: ${threads[id]?.title || id}`, 'info');
                currentThreadId = id;
                renderThreadList();
            });
        });
    }

    function deleteThread(id) {
        delete threads[id];
        if (currentThreadId === id) currentThreadId = null;
        saveThreads();
        renderThreadList();
    }

    function saveThreads() { localStorage.setItem(STORAGE_KEY, JSON.stringify(threads)); }
    function getThreadCount() { return Object.keys(threads).length; }

    return { init, openPanel, closePanel, getThreadCount, deleteThread };
})();
