/* NEXUS — Message Reactions (Phase 12)
   Quick emoji reactions on chat messages + save-to-notes/flashcard actions
*/
const Reactions = (() => {
    let initialized = false;
    const REACTIONS = ['👍', '❤️', '🔥', '💡', '😂'];
    const STORAGE_KEY = 'nexus_reactions';

    function getReactions() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    function saveReactions(r) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

    const style = document.createElement('style');
    style.textContent = `
    .msg-reaction-bar{position:absolute;top:-6px;right:8px;display:flex;gap:2px;padding:3px 6px;background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;box-shadow:0 4px 16px rgba(0,0,0,0.15);opacity:0;visibility:hidden;transform:translateY(4px);transition:all 0.15s ease;z-index:10}
    .message:hover .msg-reaction-bar{opacity:1;visibility:visible;transform:translateY(0)}
    .msg-reaction-btn{background:none;border:none;cursor:pointer;font-size:0.75rem;padding:2px 4px;border-radius:6px;transition:all 0.15s;line-height:1}
    .msg-reaction-btn:hover{background:var(--bg-hover);transform:scale(1.3)}
    .msg-reaction-actions{display:flex;gap:1px;border-left:1px solid var(--border);margin-left:4px;padding-left:4px}
    .msg-action-btn{background:none;border:none;cursor:pointer;font-size:0.65rem;padding:2px 4px;border-radius:4px;color:var(--text-tertiary);transition:all 0.15s}
    .msg-action-btn:hover{color:var(--accent);background:var(--bg-hover)}
    .msg-reactions-display{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}
    .msg-reaction-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;font-size:0.7rem;cursor:pointer;transition:all 0.15s}
    .msg-reaction-pill:hover{border-color:var(--accent);transform:scale(1.05)}
    .msg-reaction-pill.active{border-color:var(--accent);background:var(--accent-alpha,rgba(74,108,247,0.08))}
    .msg-reaction-pill-count{font-weight:700;color:var(--text-secondary);font-size:0.65rem}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        observeMessages();
        console.log('[Reactions] Initialized');
    }

    function observeMessages() {
        // Observe for new messages being added to the DOM
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('message')) {
                        injectReactionBar(node);
                    }
                });
            });
        });

        // Wait for messages-area to exist
        setTimeout(() => {
            const messagesArea = document.querySelector('.messages-area');
            if (messagesArea) {
                observer.observe(messagesArea, { childList: true });
                // Inject on existing messages
                messagesArea.querySelectorAll('.message').forEach(msg => injectReactionBar(msg));
            }
        }, 1000);
    }

    function injectReactionBar(msgEl) {
        if (msgEl.querySelector('.msg-reaction-bar')) return; // Already has one
        msgEl.style.position = 'relative';

        const bar = document.createElement('div');
        bar.className = 'msg-reaction-bar';

        // Emoji reactions
        REACTIONS.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'msg-reaction-btn';
            btn.textContent = emoji;
            btn.title = emoji;
            btn.addEventListener('click', e => {
                e.stopPropagation();
                toggleReaction(msgEl, emoji);
            });
            bar.appendChild(btn);
        });

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'msg-reaction-actions';

        // Save to notes
        if (!msgEl.classList.contains('user-message')) {
            const noteBtn = document.createElement('button');
            noteBtn.className = 'msg-action-btn';
            noteBtn.textContent = '📝';
            noteBtn.title = 'Save to Notes';
            noteBtn.addEventListener('click', e => {
                e.stopPropagation();
                const text = msgEl.querySelector('.message-bubble')?.textContent || '';
                if (typeof Notes !== 'undefined') Notes.saveFromChat(text);
                else Toast.show('Notes module not available', 'warning');
            });
            actions.appendChild(noteBtn);

            // Save as flashcard
            const fcBtn = document.createElement('button');
            fcBtn.className = 'msg-action-btn';
            fcBtn.textContent = '🃏';
            fcBtn.title = 'Save as Flashcard';
            fcBtn.addEventListener('click', e => {
                e.stopPropagation();
                const text = msgEl.querySelector('.message-bubble')?.textContent || '';
                if (typeof Flashcards !== 'undefined') Flashcards.saveFromChat(text);
                else Toast.show('Flashcards not available', 'warning');
            });
            actions.appendChild(fcBtn);

            // Fork from here
            const forkBtn = document.createElement('button');
            forkBtn.className = 'msg-action-btn';
            forkBtn.textContent = '🔀';
            forkBtn.title = 'Fork from here';
            forkBtn.addEventListener('click', e => {
                e.stopPropagation();
                const allMsgs = Array.from(msgEl.closest('.messages-area')?.querySelectorAll('.message') || []);
                const idx = allMsgs.indexOf(msgEl);
                if (idx >= 0 && typeof Chat !== 'undefined') Chat.forkChat(idx);
            });
            actions.appendChild(forkBtn);
        }

        bar.appendChild(actions);
        msgEl.appendChild(bar);

        // Render existing reactions
        renderReactionsForMsg(msgEl);
    }

    function getMsgId(msgEl) {
        // Use message index as a stable-ish ID
        const allMsgs = Array.from(msgEl.closest('.messages-area')?.querySelectorAll('.message') || []);
        const chatId = typeof Chat !== 'undefined' ? Chat.getCurrentChatId() : 'default';
        return `${chatId}_msg_${allMsgs.indexOf(msgEl)}`;
    }

    function toggleReaction(msgEl, emoji) {
        const msgId = getMsgId(msgEl);
        const reactions = getReactions();
        if (!reactions[msgId]) reactions[msgId] = {};
        if (reactions[msgId][emoji]) {
            delete reactions[msgId][emoji];
        } else {
            reactions[msgId][emoji] = 1;
        }
        saveReactions(reactions);
        renderReactionsForMsg(msgEl);
    }

    function renderReactionsForMsg(msgEl) {
        const msgId = getMsgId(msgEl);
        const reactions = getReactions();
        const msgReactions = reactions[msgId];

        // Remove old display
        msgEl.querySelector('.msg-reactions-display')?.remove();

        if (!msgReactions || !Object.keys(msgReactions).length) return;

        const display = document.createElement('div');
        display.className = 'msg-reactions-display';
        Object.entries(msgReactions).forEach(([emoji, count]) => {
            const pill = document.createElement('button');
            pill.className = 'msg-reaction-pill active';
            pill.innerHTML = `<span>${emoji}</span><span class="msg-reaction-pill-count">${count}</span>`;
            pill.addEventListener('click', e => {
                e.stopPropagation();
                toggleReaction(msgEl, emoji);
            });
            display.appendChild(pill);
        });

        const bubble = msgEl.querySelector('.message-bubble');
        if (bubble) bubble.after(display);
        else msgEl.appendChild(display);
    }

    return { init };
})();
