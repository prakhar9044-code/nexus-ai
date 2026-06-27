/* NEXUS — Typing Indicator (Phase 13)
   Animated dots while AI is generating a response
*/
const TypingIndicator = (() => {
    let initialized = false;
    let typingEl = null;

    const style = document.createElement('style');
    style.textContent = `
    .typing-indicator{display:none;align-items:center;gap:10px;padding:12px 20px;margin:8px 0;opacity:0;transition:opacity 0.3s}
    .typing-indicator.visible{display:flex;opacity:1}
    .typing-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#a855f7);display:flex;align-items:center;justify-content:center;font-size:0.7rem;flex-shrink:0}
    .typing-dots{display:flex;gap:4px;align-items:center;padding:10px 16px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:18px 18px 18px 4px}
    .typing-dot{width:7px;height:7px;border-radius:50%;background:var(--text-tertiary);animation:typingBounce 1.4s infinite ease-in-out both}
    .typing-dot:nth-child(1){animation-delay:0s}
    .typing-dot:nth-child(2){animation-delay:0.15s}
    .typing-dot:nth-child(3){animation-delay:0.3s}
    @keyframes typingBounce{0%,80%,100%{transform:scale(0.6);opacity:0.4}40%{transform:scale(1);opacity:1}}
    .typing-label{font-size:0.68rem;color:var(--text-tertiary);font-style:italic}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createIndicator();
        hookIntoChat();
        console.log('[TypingIndicator] Initialized');
    }

    function createIndicator() {
        typingEl = document.createElement('div');
        typingEl.className = 'typing-indicator';
        typingEl.id = 'typing-indicator';
        typingEl.innerHTML = `
            <div class="typing-avatar">🤖</div>
            <div>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <div class="typing-label">Nexus is thinking...</div>
            </div>
        `;

        // Append after messages area loads
        setTimeout(() => {
            const area = document.querySelector('.messages-area');
            if (area) area.appendChild(typingEl);
        }, 1500);
    }

    function hookIntoChat() {
        // Hook into the send button to show/hide typing indicator
        setTimeout(() => {
            const sendBtn = document.getElementById('send-btn');
            const form = document.querySelector('.input-area');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => {
                    setTimeout(show, 100);
                });
            }
            // Also hook into Enter key
            const input = document.getElementById('user-input');
            if (input) {
                input.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) {
                        setTimeout(show, 100);
                    }
                });
            }

            // Watch for AI responses to auto-hide
            const area = document.querySelector('.messages-area');
            if (area) {
                const observer = new MutationObserver(mutations => {
                    mutations.forEach(m => {
                        m.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && !node.classList?.contains('user-message') && node.classList?.contains('message')) {
                                hide();
                            }
                        });
                    });
                });
                observer.observe(area, { childList: true });
            }
        }, 1500);
    }

    function show() {
        if (!typingEl) return;
        typingEl.classList.add('visible');
        // Scroll to show typing indicator
        const area = document.querySelector('.messages-area');
        if (area) {
            // Move typing indicator to end
            area.appendChild(typingEl);
            area.scrollTop = area.scrollHeight;
        }
    }

    function hide() {
        if (!typingEl) return;
        typingEl.classList.remove('visible');
    }

    return { init, show, hide };
})();
