/* NEXUS — AI Smart Recap (Phase 12)
   AI-generated daily summaries of what the user learned
*/
const Recap = (() => {
    let initialized = false;
    const STORAGE_KEY = 'nexus_recaps';

    const style = document.createElement('style');
    style.textContent = `
    .recap-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .recap-overlay.active{opacity:1;visibility:visible}
    .recap-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;width:min(520px,92vw);max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .recap-overlay.active .recap-modal{transform:scale(1)}
    .recap-header{display:flex;align-items:center;gap:10px;padding:20px 24px 12px;border-bottom:1px solid var(--border)}
    .recap-header h3{flex:1;font-size:1.1rem;font-weight:700}
    .recap-close{background:none;border:none;font-size:1.2rem;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;border-radius:6px}
    .recap-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .recap-body{flex:1;overflow-y:auto;padding:20px 24px}
    .recap-tabs{display:flex;gap:4px;padding:8px 20px;border-bottom:1px solid var(--border)}
    .recap-tab{padding:6px 14px;border:none;background:none;color:var(--text-tertiary);font-size:0.75rem;font-weight:600;border-radius:8px;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .recap-tab:hover{color:var(--text-primary);background:var(--bg-hover)}
    .recap-tab.active{color:var(--accent);background:var(--accent-alpha,rgba(74,108,247,0.08))}
    .recap-generate{display:flex;flex-direction:column;align-items:center;padding:30px 20px;text-align:center;gap:12px}
    .recap-generate-icon{font-size:3rem}
    .recap-generate-title{font-size:1rem;font-weight:700;color:var(--text-primary)}
    .recap-generate-desc{font-size:0.8rem;color:var(--text-tertiary);max-width:320px}
    .recap-generate-btn{padding:12px 32px;background:var(--accent);color:#fff;border:none;border-radius:14px;font-size:0.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .recap-generate-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .recap-generate-btn:disabled{opacity:0.5;cursor:not-allowed}
    .recap-content{font-size:0.85rem;line-height:1.8;color:var(--text-primary)}
    .recap-content h4{font-size:0.9rem;font-weight:700;margin:16px 0 8px;color:var(--accent);display:flex;align-items:center;gap:6px}
    .recap-content ul{padding-left:20px;margin:6px 0}
    .recap-content li{margin:4px 0;color:var(--text-secondary)}
    .recap-loading{text-align:center;padding:40px;color:var(--text-tertiary)}
    .recap-loading .spinner{display:inline-block;width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .recap-history-item{padding:12px 16px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s}
    .recap-history-item:hover{border-color:var(--accent);background:var(--bg-hover)}
    .recap-history-date{font-size:0.78rem;font-weight:700;color:var(--text-primary)}
    .recap-history-preview{font-size:0.72rem;color:var(--text-tertiary);margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createOverlay();
        console.log('[Recap] Initialized');
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'recap-overlay';
        overlay.id = 'recap-overlay';
        overlay.innerHTML = `
            <div class="recap-modal">
                <div class="recap-header">
                    <h3>📝 Smart Recap</h3>
                    <button class="recap-close" id="recap-close">✕</button>
                </div>
                <div class="recap-tabs">
                    <button class="recap-tab active" data-tab="generate">Generate</button>
                    <button class="recap-tab" data-tab="history">History</button>
                </div>
                <div class="recap-body" id="recap-body">
                    <div class="recap-generate">
                        <div class="recap-generate-icon">🧠</div>
                        <div class="recap-generate-title">Today's Learning Recap</div>
                        <div class="recap-generate-desc">AI will analyze your conversations and create a summary of what you learned, key takeaways, and action items.</div>
                        <button class="recap-generate-btn" id="recap-generate-btn">✨ Generate Recap</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('recap-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.getElementById('recap-generate-btn').addEventListener('click', generateRecap);

        overlay.querySelectorAll('.recap-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelectorAll('.recap-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.dataset.tab === 'history') showHistory();
                else showGenerate();
            });
        });
    }

    function showGenerate() {
        const body = document.getElementById('recap-body');
        if (!body) return;
        body.innerHTML = `
            <div class="recap-generate">
                <div class="recap-generate-icon">🧠</div>
                <div class="recap-generate-title">Today's Learning Recap</div>
                <div class="recap-generate-desc">AI will analyze your conversations and create a summary of what you learned, key takeaways, and action items.</div>
                <button class="recap-generate-btn" id="recap-generate-btn">✨ Generate Recap</button>
            </div>`;
        document.getElementById('recap-generate-btn').addEventListener('click', generateRecap);
    }

    async function generateRecap() {
        const body = document.getElementById('recap-body');
        if (!body) return;
        body.innerHTML = '<div class="recap-loading"><div class="spinner"></div><p style="margin-top:12px">Analyzing your conversations...</p></div>';

        // Gather today's chat messages
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const todayStr = new Date().toDateString();
        let allMessages = [];
        Object.values(chats).forEach(chat => {
            if (!chat.messages) return;
            chat.messages.forEach(msg => {
                const msgDate = msg.time ? new Date(msg.time).toDateString() : todayStr;
                if (msgDate === todayStr) {
                    allMessages.push(`${msg.role === 'user' ? 'User' : 'AI'}: ${(msg.text || msg.content || '').substring(0, 300)}`);
                }
            });
        });

        if (allMessages.length < 2) {
            body.innerHTML = `<div class="recap-generate">
                <div class="recap-generate-icon">📭</div>
                <div class="recap-generate-title">Not enough data yet</div>
                <div class="recap-generate-desc">Chat more today and come back for your recap! You need at least a few conversations.</div>
                <button class="recap-generate-btn" id="recap-generate-btn">Try Anyway</button>
            </div>`;
            document.getElementById('recap-generate-btn')?.addEventListener('click', () => forceGenerate(body));
            return;
        }

        await forceGenerate(body, allMessages);
    }

    async function forceGenerate(body, messages) {
        if (!messages) messages = ['User: Tell me about my progress today'];
        body.innerHTML = '<div class="recap-loading"><div class="spinner"></div><p style="margin-top:12px">Generating your recap...</p></div>';

        const prompt = `Based on these conversation snippets from today, generate a learning recap. Format with sections:
## 📚 Topics Covered
- List key topics discussed

## 💡 Key Takeaways
- Important things learned

## 🎯 Action Items
- Suggested next steps

## 📊 Progress Assessment
- Brief assessment of learning progress

Conversations:
${messages.slice(0, 30).join('\n')}`;

        try {
            let result = '';
            if (typeof Nexus !== 'undefined' && Nexus.rawStream) {
                for await (const chunk of Nexus.rawStream('chat', prompt, 'Generate a learning recap summary. Be concise and actionable.')) {
                    result += chunk;
                }
            } else {
                result = '## 📚 Topics Covered\n- General conversation practice\n\n## 💡 Key Takeaways\n- Keep learning consistently!\n\n## 🎯 Action Items\n- Set specific learning goals\n- Review challenging topics\n\n## 📊 Progress Assessment\n- You\'re making progress! Keep the streak going.';
            }

            // Save recap
            const recaps = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            recaps.unshift({
                date: new Date().toISOString(),
                content: result,
                messageCount: messages.length
            });
            if (recaps.length > 14) recaps.splice(14);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recaps));

            // Render
            body.innerHTML = `<div class="recap-content">${formatRecap(result)}</div>`;
        } catch (err) {
            console.error('[Recap] Error:', err);
            body.innerHTML = `<div class="recap-generate">
                <div class="recap-generate-icon">⚠️</div>
                <div class="recap-generate-title">Couldn't generate recap</div>
                <div class="recap-generate-desc">${err.message || 'Something went wrong. Please try again.'}</div>
                <button class="recap-generate-btn" id="recap-generate-btn">Retry</button>
            </div>`;
            document.getElementById('recap-generate-btn')?.addEventListener('click', generateRecap);
        }
    }

    function formatRecap(text) {
        return text
            .replace(/## (.*)/g, '<h4>$1</h4>')
            .replace(/^- (.*)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }

    function showHistory() {
        const body = document.getElementById('recap-body');
        if (!body) return;
        const recaps = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        if (!recaps.length) {
            body.innerHTML = '<div class="recap-generate"><div class="recap-generate-icon">📭</div><div class="recap-generate-title">No recaps yet</div><div class="recap-generate-desc">Generate your first recap to see it here!</div></div>';
            return;
        }

        body.innerHTML = recaps.map((r, i) => {
            const date = new Date(r.date);
            const dateStr = date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
            const preview = r.content.replace(/[#*\-]/g, '').substring(0, 120);
            return `<div class="recap-history-item" data-idx="${i}">
                <div class="recap-history-date">📝 ${dateStr} · ${r.messageCount || 0} messages</div>
                <div class="recap-history-preview">${preview}...</div>
            </div>`;
        }).join('');

        body.querySelectorAll('.recap-history-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.idx);
                const recap = recaps[idx];
                if (recap) body.innerHTML = `<div class="recap-content">${formatRecap(recap.content)}</div>`;
            });
        });
    }

    function open() { document.getElementById('recap-overlay')?.classList.add('active'); }
    function close() { document.getElementById('recap-overlay')?.classList.remove('active'); }

    return { init, open, close };
})();
