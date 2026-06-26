/* NEXUS — Flashcard Generator (Phase 12)
   Create study flashcards from AI responses with spaced repetition
*/
const Flashcards = (() => {
    let initialized = false;
    const STORAGE_KEY = 'nexus_flashcards';
    let currentIdx = 0;
    let isFlipped = false;

    function getCards() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    function saveCards(cards) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cards)); }

    const style = document.createElement('style');
    style.textContent = `
    .fc-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .fc-overlay.active{opacity:1;visibility:visible}
    .fc-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;width:min(480px,92vw);max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .fc-overlay.active .fc-modal{transform:scale(1)}
    .fc-header{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border)}
    .fc-header h3{flex:1;font-size:1rem;font-weight:700;display:flex;align-items:center;gap:6px}
    .fc-close{background:none;border:none;font-size:1.2rem;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;border-radius:6px}
    .fc-tabs{display:flex;gap:4px;padding:6px 16px;border-bottom:1px solid var(--border)}
    .fc-tab{padding:5px 12px;border:none;background:none;color:var(--text-tertiary);font-size:0.72rem;font-weight:600;border-radius:8px;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .fc-tab:hover{color:var(--text-primary);background:var(--bg-hover)}
    .fc-tab.active{color:var(--accent);background:var(--accent-alpha,rgba(74,108,247,0.08))}
    .fc-body{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;align-items:center}
    .fc-stats{display:flex;gap:12px;width:100%;margin-bottom:16px;justify-content:center}
    .fc-stat{text-align:center;padding:8px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;flex:1;max-width:100px}
    .fc-stat-val{font-size:1.2rem;font-weight:800;color:var(--accent)}
    .fc-stat-lbl{font-size:0.6rem;color:var(--text-tertiary);margin-top:2px;text-transform:uppercase}
    .fc-card-container{width:100%;max-width:360px;height:220px;perspective:1000px;cursor:pointer;margin:12px 0}
    .fc-card{width:100%;height:100%;position:relative;transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);transform-style:preserve-3d}
    .fc-card.flipped{transform:rotateY(180deg)}
    .fc-card-face{position:absolute;inset:0;backface-visibility:hidden;border-radius:18px;border:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
    .fc-card-front{background:linear-gradient(135deg,var(--bg-secondary),var(--bg-primary))}
    .fc-card-back{background:linear-gradient(135deg,rgba(74,108,247,0.05),var(--bg-primary));transform:rotateY(180deg)}
    .fc-card-label{font-size:0.65rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:700}
    .fc-card-text{font-size:0.92rem;color:var(--text-primary);line-height:1.6;font-weight:500;max-height:140px;overflow-y:auto}
    .fc-card-hint{font-size:0.65rem;color:var(--text-tertiary);margin-top:auto;padding-top:8px}
    .fc-nav{display:flex;align-items:center;gap:16px;margin:12px 0}
    .fc-nav-btn{width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:var(--bg-secondary);color:var(--text-secondary);cursor:pointer;font-size:1rem;transition:all 0.15s;display:flex;align-items:center;justify-content:center}
    .fc-nav-btn:hover{border-color:var(--accent);color:var(--accent)}
    .fc-nav-btn:disabled{opacity:0.3;cursor:not-allowed}
    .fc-counter{font-size:0.78rem;color:var(--text-tertiary);font-weight:600}
    .fc-difficulty{display:flex;gap:8px;width:100%;max-width:360px}
    .fc-diff-btn{flex:1;padding:10px;border:1px solid var(--border);border-radius:10px;background:none;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;text-align:center}
    .fc-diff-btn:hover{transform:translateY(-1px)}
    .fc-diff-easy{color:#22c55e;border-color:rgba(34,197,94,0.3)}.fc-diff-easy:hover{background:rgba(34,197,94,0.08)}
    .fc-diff-med{color:#f59e0b;border-color:rgba(245,158,11,0.3)}.fc-diff-med:hover{background:rgba(245,158,11,0.08)}
    .fc-diff-hard{color:#ef4444;border-color:rgba(239,68,68,0.3)}.fc-diff-hard:hover{background:rgba(239,68,68,0.08)}
    .fc-create{width:100%}
    .fc-create-input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:var(--bg-secondary);color:var(--text-primary);font-size:0.82rem;font-family:var(--font-body);outline:none;margin-bottom:8px;resize:vertical;min-height:60px}
    .fc-create-input:focus{border-color:var(--accent)}
    .fc-create-btn{width:100%;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .fc-create-btn:hover{filter:brightness(1.1)}
    .fc-empty{text-align:center;padding:40px 20px;color:var(--text-tertiary)}
    .fc-empty-icon{font-size:2.5rem;margin-bottom:8px}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createOverlay();
        console.log('[Flashcards] Initialized');
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'fc-overlay';
        overlay.id = 'fc-overlay';
        overlay.innerHTML = `
            <div class="fc-modal">
                <div class="fc-header">
                    <h3>🃏 Flashcards</h3>
                    <button class="fc-close" id="fc-close">✕</button>
                </div>
                <div class="fc-tabs">
                    <button class="fc-tab active" data-tab="study">Study</button>
                    <button class="fc-tab" data-tab="create">Create</button>
                    <button class="fc-tab" data-tab="manage">Manage</button>
                </div>
                <div class="fc-body" id="fc-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('fc-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        overlay.querySelectorAll('.fc-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                overlay.querySelectorAll('.fc-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.dataset.tab === 'study') renderStudy();
                else if (tab.dataset.tab === 'create') renderCreate();
                else renderManage();
            });
        });
    }

    function renderStudy() {
        const body = document.getElementById('fc-body');
        if (!body) return;
        const cards = getCards();
        const due = cards.filter(c => !c.nextReview || new Date(c.nextReview) <= new Date());
        const mastered = cards.filter(c => c.ease >= 3);

        if (!cards.length) {
            body.innerHTML = '<div class="fc-empty"><div class="fc-empty-icon">🃏</div><p>No flashcards yet!</p><p style="font-size:0.75rem">Create cards manually or save from AI responses.</p></div>';
            return;
        }
        if (!due.length) {
            body.innerHTML = '<div class="fc-empty"><div class="fc-empty-icon">🎉</div><p>All caught up!</p><p style="font-size:0.75rem">No cards due for review. Come back later!</p></div>';
            return;
        }

        currentIdx = Math.min(currentIdx, due.length - 1);
        isFlipped = false;
        const card = due[currentIdx];

        body.innerHTML = `
            <div class="fc-stats">
                <div class="fc-stat"><div class="fc-stat-val">${cards.length}</div><div class="fc-stat-lbl">Total</div></div>
                <div class="fc-stat"><div class="fc-stat-val">${due.length}</div><div class="fc-stat-lbl">Due</div></div>
                <div class="fc-stat"><div class="fc-stat-val">${mastered.length}</div><div class="fc-stat-lbl">Mastered</div></div>
            </div>
            <div class="fc-card-container" id="fc-card-container">
                <div class="fc-card" id="fc-card">
                    <div class="fc-card-face fc-card-front">
                        <div class="fc-card-label">Question</div>
                        <div class="fc-card-text">${escHtml(card.front)}</div>
                        <div class="fc-card-hint">Click to flip</div>
                    </div>
                    <div class="fc-card-face fc-card-back">
                        <div class="fc-card-label">Answer</div>
                        <div class="fc-card-text">${escHtml(card.back)}</div>
                    </div>
                </div>
            </div>
            <div class="fc-nav">
                <button class="fc-nav-btn" id="fc-prev" ${currentIdx === 0 ? 'disabled' : ''}>◀</button>
                <span class="fc-counter">${currentIdx + 1} / ${due.length}</span>
                <button class="fc-nav-btn" id="fc-next" ${currentIdx >= due.length - 1 ? 'disabled' : ''}>▶</button>
            </div>
            <div class="fc-difficulty">
                <button class="fc-diff-btn fc-diff-hard" data-ease="1">😰 Hard<br><span style="font-size:0.6rem">Review now</span></button>
                <button class="fc-diff-btn fc-diff-med" data-ease="2">🤔 Medium<br><span style="font-size:0.6rem">Tomorrow</span></button>
                <button class="fc-diff-btn fc-diff-easy" data-ease="3">😎 Easy<br><span style="font-size:0.6rem">3 days</span></button>
            </div>`;

        document.getElementById('fc-card-container').addEventListener('click', () => {
            document.getElementById('fc-card')?.classList.toggle('flipped');
            isFlipped = !isFlipped;
        });
        document.getElementById('fc-prev')?.addEventListener('click', () => { currentIdx--; renderStudy(); });
        document.getElementById('fc-next')?.addEventListener('click', () => { currentIdx++; renderStudy(); });

        body.querySelectorAll('.fc-diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ease = parseInt(btn.dataset.ease);
                rateCard(card.id, ease);
                if (currentIdx < due.length - 1) currentIdx++;
                renderStudy();
            });
        });
    }

    function renderCreate() {
        const body = document.getElementById('fc-body');
        if (!body) return;
        body.innerHTML = `
            <div class="fc-create">
                <p style="font-size:0.78rem;color:var(--text-tertiary);margin-bottom:12px">Create a new flashcard</p>
                <textarea class="fc-create-input" id="fc-front" placeholder="Front (Question)..." rows="3"></textarea>
                <textarea class="fc-create-input" id="fc-back" placeholder="Back (Answer)..." rows="3"></textarea>
                <button class="fc-create-btn" id="fc-create-btn">➕ Add Flashcard</button>
            </div>`;

        document.getElementById('fc-create-btn').addEventListener('click', () => {
            const front = document.getElementById('fc-front')?.value.trim();
            const back = document.getElementById('fc-back')?.value.trim();
            if (!front || !back) { Toast.show('Fill both sides!', 'warning'); return; }
            addCard(front, back);
            Toast.show('🃏 Flashcard created!', 'success');
            document.getElementById('fc-front').value = '';
            document.getElementById('fc-back').value = '';
        });
    }

    function renderManage() {
        const body = document.getElementById('fc-body');
        if (!body) return;
        const cards = getCards();
        if (!cards.length) {
            body.innerHTML = '<div class="fc-empty"><div class="fc-empty-icon">📭</div><p>No cards yet</p></div>';
            return;
        }
        body.innerHTML = cards.map((c, i) => `
            <div style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;display:flex;align-items:center;gap:10px">
                <div style="flex:1;min-width:0">
                    <div style="font-size:0.8rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(c.front)}</div>
                    <div style="font-size:0.7rem;color:var(--text-tertiary);margin-top:2px">Ease: ${'⭐'.repeat(c.ease || 0)}</div>
                </div>
                <button style="background:none;border:none;cursor:pointer;font-size:0.85rem;color:var(--text-tertiary)" data-del="${c.id}" title="Delete">🗑️</button>
            </div>
        `).join('');

        body.querySelectorAll('[data-del]').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteCard(btn.dataset.del);
                renderManage();
                Toast.show('Card deleted', 'info');
            });
        });
    }

    function addCard(front, back) {
        const cards = getCards();
        cards.push({ id: 'fc_' + Date.now(), front, back, ease: 0, nextReview: null, created: Date.now() });
        saveCards(cards);
    }

    function rateCard(id, ease) {
        const cards = getCards();
        const card = cards.find(c => c.id === id);
        if (!card) return;
        card.ease = ease;
        const delays = { 1: 0, 2: 86400000, 3: 259200000 }; // now, 1 day, 3 days
        card.nextReview = new Date(Date.now() + (delays[ease] || 0)).toISOString();
        saveCards(cards);
    }

    function deleteCard(id) {
        const cards = getCards().filter(c => c.id !== id);
        saveCards(cards);
    }

    // Called from chat message action: save AI response as flashcard
    function saveFromChat(text) {
        const lines = text.split('\n').filter(l => l.trim());
        const front = lines[0]?.substring(0, 200) || 'Review this';
        const back = lines.slice(1).join('\n').substring(0, 500) || text.substring(0, 500);
        addCard(front, back);
        Toast.show('🃏 Saved as flashcard!', 'success');
    }

    function escHtml(s) {
        const d = document.createElement('div');
        d.textContent = s || '';
        return d.innerHTML;
    }

    function open() { document.getElementById('fc-overlay')?.classList.add('active'); renderStudy(); }
    function close() { document.getElementById('fc-overlay')?.classList.remove('active'); }

    return { init, open, close, addCard, saveFromChat };
})();
