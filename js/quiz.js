/* ============================================
   NEXUS — AI Quiz Generator
   Phase 15.1: Auto-generate quizzes from chats
   ============================================ */
const Quiz = (() => {
    const HISTORY_KEY = 'nexus_quiz_history';
    let overlay = null, currentQuiz = null, currentIdx = 0, score = 0, answered = [];

    const style = document.createElement('style');
    style.textContent = `
    .quiz-overlay{position:fixed;inset:0;z-index:9660;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .quiz-overlay.active{opacity:1;visibility:visible}
    .quiz-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:540px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .quiz-overlay.active .quiz-modal{transform:scale(1)}
    .quiz-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .quiz-header h2{font-size:1rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .quiz-close{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:6px;border-radius:8px;font-size:1.1rem;transition:all 0.2s}
    .quiz-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .quiz-body{flex:1;overflow-y:auto;padding:20px}
    .quiz-progress{display:flex;align-items:center;gap:10px;margin-bottom:16px}
    .quiz-progress-bar{flex:1;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden}
    .quiz-progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),#a855f7);border-radius:3px;transition:width 0.4s ease}
    .quiz-progress-text{font-size:0.72rem;color:var(--text-tertiary);font-weight:600;white-space:nowrap}
    .quiz-question{font-size:0.95rem;font-weight:600;color:var(--text-primary);margin-bottom:16px;line-height:1.5}
    .quiz-type-badge{display:inline-block;font-size:0.6rem;padding:2px 8px;border-radius:8px;background:var(--accent);color:#fff;font-weight:600;margin-bottom:8px;text-transform:uppercase}
    .quiz-options{display:flex;flex-direction:column;gap:8px}
    .quiz-option{padding:12px 16px;background:var(--bg-secondary);border:2px solid var(--border);border-radius:12px;cursor:pointer;transition:all 0.2s;font-size:0.85rem;color:var(--text-primary);text-align:left;font-family:var(--font-body)}
    .quiz-option:hover:not(.selected):not(.correct):not(.wrong){border-color:var(--accent);background:var(--bg-hover)}
    .quiz-option.selected{border-color:var(--accent);background:rgba(74,108,247,0.1)}
    .quiz-option.correct{border-color:#22c55e;background:rgba(34,197,94,0.1);color:#22c55e}
    .quiz-option.wrong{border-color:#ef4444;background:rgba(239,68,68,0.1);color:#ef4444}
    .quiz-fill-input{width:100%;padding:12px 16px;background:var(--bg-secondary);border:2px solid var(--border);border-radius:12px;color:var(--text-primary);font-size:0.85rem;font-family:var(--font-body);outline:none;transition:border-color 0.2s}
    .quiz-fill-input:focus{border-color:var(--accent)}
    .quiz-explanation{margin-top:12px;padding:12px;background:var(--bg-hover);border-radius:10px;font-size:0.78rem;color:var(--text-secondary);line-height:1.5;border-left:3px solid var(--accent)}
    .quiz-actions{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
    .quiz-btn{padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600;transition:all 0.2s;font-family:var(--font-body)}
    .quiz-btn.primary{background:var(--accent);color:#fff}
    .quiz-btn.primary:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .quiz-btn.secondary{background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)}
    .quiz-score-card{text-align:center;padding:20px 0}
    .quiz-score-big{font-size:3rem;font-weight:800;background:linear-gradient(135deg,var(--accent),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .quiz-score-label{font-size:0.85rem;color:var(--text-tertiary);margin-top:4px}
    .quiz-score-grade{font-size:1.4rem;margin-top:8px}
    .quiz-gen-prompt{text-align:center;padding:30px 10px}
    .quiz-gen-prompt p{font-size:0.85rem;color:var(--text-secondary);margin-bottom:14px}
    .quiz-me-btn{background:none;border:none;cursor:pointer;font-size:0.72rem;padding:3px 8px;border-radius:6px;transition:all 0.2s;opacity:0;color:var(--text-tertiary);display:inline-flex;align-items:center;gap:4px}
    .message:hover .quiz-me-btn{opacity:0.7}
    .quiz-me-btn:hover{opacity:1!important;color:var(--accent);background:var(--bg-hover)}
    @media(max-width:768px){.quiz-modal{max-width:98vw;max-height:92vh;border-radius:14px}}
    `;
    document.head.appendChild(style);

    function init() {
        createOverlay();
        observeMessages();
        console.log('[Quiz] Initialized');
    }

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'quiz-overlay';
        overlay.innerHTML = `
        <div class="quiz-modal">
            <div class="quiz-header"><h2>🧠 Quiz Mode</h2><button class="quiz-close">✕</button></div>
            <div class="quiz-body"></div>
        </div>`;
        overlay.querySelector('.quiz-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.body.appendChild(overlay);
    }

    function observeMessages() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('message') && !node.classList.contains('user-message')) addQuizBtn(node);
                    if (node.nodeType === 1) node.querySelectorAll?.('.message:not(.user-message)')?.forEach(addQuizBtn);
                });
            });
        });
        const msgArea = document.querySelector('.messages-area');
        if (msgArea) {
            observer.observe(msgArea, { childList: true, subtree: true });
            msgArea.querySelectorAll('.message:not(.user-message)').forEach(addQuizBtn);
        }
    }

    function addQuizBtn(msgEl) {
        if (msgEl.querySelector('.quiz-me-btn')) return;
        const actions = msgEl.querySelector('.message-actions');
        if (!actions) return;
        const btn = document.createElement('button');
        btn.className = 'quiz-me-btn';
        btn.innerHTML = '🧠 Quiz';
        btn.title = 'Generate quiz from this response';
        btn.addEventListener('click', () => {
            const text = msgEl.querySelector('.message-bubble')?.textContent?.trim() || '';
            if (text.length < 20) { if (typeof Toast !== 'undefined') Toast.show('Response too short for quiz', 'info'); return; }
            generateQuiz(text);
        });
        actions.appendChild(btn);
    }

    async function generateQuiz(sourceText) {
        open();
        const body = overlay.querySelector('.quiz-body');
        body.innerHTML = `<div class="quiz-gen-prompt"><div style="font-size:2rem;margin-bottom:12px">🧠</div><p>Generating quiz questions...</p><div style="width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto"></div></div>`;

        try {
            const prompt = `Based on this content, generate exactly 5 quiz questions in valid JSON array format. Mix question types. Return ONLY the JSON array, no other text.

Content: "${sourceText.substring(0, 3000)}"

JSON format: [{"type":"mcq","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},{"type":"truefalse","question":"...","options":["True","False"],"correct":0,"explanation":"..."},{"type":"fill","question":"... ___ ...","answer":"word","explanation":"..."}]`;

            let response = '';
            if (typeof Nexus !== 'undefined') {
                response = await Nexus.ask('chat', prompt);
            }
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('Invalid response');
            currentQuiz = JSON.parse(jsonMatch[0]);
            currentIdx = 0; score = 0; answered = [];
            renderQuestion();
        } catch (err) {
            body.innerHTML = `<div class="quiz-gen-prompt"><div style="font-size:2rem;margin-bottom:12px">😕</div><p>Could not generate quiz. Try again!</p><button class="quiz-btn primary" onclick="Quiz.close()">Close</button></div>`;
        }
    }

    function renderQuestion() {
        const body = overlay.querySelector('.quiz-body');
        if (!currentQuiz || currentIdx >= currentQuiz.length) { renderScore(); return; }
        const q = currentQuiz[currentIdx];
        const progress = ((currentIdx) / currentQuiz.length) * 100;
        const typeLabel = q.type === 'mcq' ? 'Multiple Choice' : q.type === 'truefalse' ? 'True / False' : 'Fill in the Blank';

        let optionsHtml = '';
        if (q.type === 'fill') {
            optionsHtml = `<input class="quiz-fill-input" placeholder="Type your answer..." id="quiz-fill-ans"/>`;
        } else {
            optionsHtml = `<div class="quiz-options">${(q.options || []).map((opt, i) => `<button class="quiz-option" data-idx="${i}">${opt}</button>`).join('')}</div>`;
        }

        body.innerHTML = `
            <div class="quiz-progress"><div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${progress}%"></div></div><div class="quiz-progress-text">${currentIdx + 1}/${currentQuiz.length}</div></div>
            <div class="quiz-type-badge">${typeLabel}</div>
            <div class="quiz-question">${q.question}</div>
            ${optionsHtml}
            <div class="quiz-actions">
                <button class="quiz-btn primary" id="quiz-submit-btn">${q.type === 'fill' ? 'Check' : 'Select an answer'}</button>
            </div>`;

        if (q.type === 'fill') {
            body.querySelector('#quiz-submit-btn').addEventListener('click', () => {
                const ans = document.getElementById('quiz-fill-ans')?.value.trim().toLowerCase() || '';
                const correct = (q.answer || '').toLowerCase();
                const isRight = ans === correct || correct.includes(ans);
                showResult(isRight, q.type === 'fill' ? -1 : 0);
            });
        } else {
            body.querySelectorAll('.quiz-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    if (body.querySelector('.quiz-option.correct')) return;
                    const idx = parseInt(opt.dataset.idx);
                    const isRight = idx === q.correct;
                    opt.classList.add(isRight ? 'correct' : 'wrong');
                    if (!isRight) body.querySelectorAll('.quiz-option')[q.correct]?.classList.add('correct');
                    showResult(isRight, idx);
                });
            });
        }
    }

    function showResult(isRight, selectedIdx) {
        if (isRight) score++;
        answered.push({ idx: currentIdx, correct: isRight, selected: selectedIdx });
        const q = currentQuiz[currentIdx];
        const body = overlay.querySelector('.quiz-body');
        const actions = body.querySelector('.quiz-actions');

        // Show explanation
        const existingExp = body.querySelector('.quiz-explanation');
        if (!existingExp && q.explanation) {
            const exp = document.createElement('div');
            exp.className = 'quiz-explanation';
            exp.textContent = (isRight ? '✅ Correct! ' : '❌ Incorrect. ') + q.explanation;
            actions.before(exp);
        }

        actions.innerHTML = `<button class="quiz-btn primary" id="quiz-next-btn">${currentIdx < currentQuiz.length - 1 ? 'Next →' : 'See Results'}</button>`;
        body.querySelector('#quiz-next-btn').addEventListener('click', () => { currentIdx++; renderQuestion(); });
    }

    function renderScore() {
        const body = overlay.querySelector('.quiz-body');
        const pct = currentQuiz.length ? Math.round((score / currentQuiz.length) * 100) : 0;
        const grade = pct >= 90 ? '🏆 Excellent!' : pct >= 70 ? '⭐ Great job!' : pct >= 50 ? '👍 Good effort!' : '💪 Keep learning!';

        // Save to history
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history.unshift({ score, total: currentQuiz.length, pct, date: Date.now() });
        if (history.length > 20) history.length = 20;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        body.innerHTML = `
        <div class="quiz-score-card">
            <div class="quiz-score-big">${score}/${currentQuiz.length}</div>
            <div class="quiz-score-label">${pct}% correct</div>
            <div class="quiz-score-grade">${grade}</div>
        </div>
        <div class="quiz-actions" style="justify-content:center">
            <button class="quiz-btn secondary" id="quiz-retry">🔄 Retry</button>
            <button class="quiz-btn primary" id="quiz-done">Done</button>
        </div>`;
        body.querySelector('#quiz-retry')?.addEventListener('click', () => { currentIdx = 0; score = 0; answered = []; renderQuestion(); });
        body.querySelector('#quiz-done')?.addEventListener('click', close);

        if (typeof Toast !== 'undefined') Toast.show(`🧠 Quiz complete: ${score}/${currentQuiz.length}`, pct >= 70 ? 'xp' : 'info');
    }

    function open() { overlay?.classList.add('active'); }
    function close() { overlay?.classList.remove('active'); }

    return { init, open, close, generateQuiz };
})();
