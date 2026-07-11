/* ============================================
   NEXUS — Smart Notifications Engine
   Phase 15.2: Study reminders, streaks, goals, achievements
   ============================================ */
const SmartNotify = (() => {
    const GOALS_KEY = 'nexus_study_goals';
    const ACHIEVEMENTS_KEY = 'nexus_achievements_unlocked';
    const LAST_NUDGE_KEY = 'nexus_last_nudge';
    let goals = {}, unlocked = [];

    const ACHIEVEMENTS = [
        { id: 'first_chat', icon: '💬', title: 'First Words', desc: 'Send your first message', check: () => getTotalMessages() >= 1 },
        { id: 'chat_10', icon: '🗣️', title: 'Chatty', desc: 'Send 10 messages', check: () => getTotalMessages() >= 10 },
        { id: 'chat_50', icon: '🔥', title: 'On Fire', desc: 'Send 50 messages', check: () => getTotalMessages() >= 50 },
        { id: 'chat_100', icon: '💎', title: 'Centurion', desc: 'Send 100 messages', check: () => getTotalMessages() >= 100 },
        { id: 'chat_500', icon: '👑', title: 'Legend', desc: 'Send 500 messages', check: () => getTotalMessages() >= 500 },
        { id: 'streak_3', icon: '🔥', title: 'Heating Up', desc: '3-day study streak', check: () => getStreak() >= 3 },
        { id: 'streak_7', icon: '⚡', title: 'Week Warrior', desc: '7-day study streak', check: () => getStreak() >= 7 },
        { id: 'streak_30', icon: '🏆', title: 'Monthly Master', desc: '30-day study streak', check: () => getStreak() >= 30 },
        { id: 'quiz_1', icon: '🧠', title: 'Quiz Taker', desc: 'Complete your first quiz', check: () => getQuizCount() >= 1 },
        { id: 'quiz_10', icon: '🎓', title: 'Quiz Master', desc: 'Complete 10 quizzes', check: () => getQuizCount() >= 10 },
        { id: 'night_owl', icon: '🦉', title: 'Night Owl', desc: 'Study after midnight', check: () => new Date().getHours() < 5 },
        { id: 'early_bird', icon: '🐦', title: 'Early Bird', desc: 'Study before 7 AM', check: () => { const h = new Date().getHours(); return h >= 5 && h < 7; } },
        { id: 'flashcard_5', icon: '📇', title: 'Card Collector', desc: 'Create 5 flashcards', check: () => getFlashcardCount() >= 5 },
        { id: 'planner_3', icon: '📋', title: 'Planner Pro', desc: 'Complete 3 study tasks', check: () => getCompletedTasks() >= 3 },
    ];

    const style = document.createElement('style');
    style.textContent = `
    .goals-overlay{position:fixed;inset:0;z-index:9660;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .goals-overlay.active{opacity:1;visibility:visible}
    .goals-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:480px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .goals-overlay.active .goals-modal{transform:scale(1)}
    .goals-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .goals-header h2{font-size:1rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .goals-close{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:6px;border-radius:8px;font-size:1.1rem}
    .goals-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .goals-tabs{display:flex;gap:2px;padding:10px 16px 0;border-bottom:1px solid var(--border)}
    .goals-tab{padding:8px 14px;font-size:0.78rem;font-weight:500;color:var(--text-tertiary);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all 0.2s;font-family:var(--font-body)}
    .goals-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
    .goals-body{flex:1;overflow-y:auto;padding:16px 20px}
    .goal-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:10px}
    .goal-card h4{font-size:0.82rem;font-weight:600;color:var(--text-primary);margin-bottom:6px}
    .goal-bar{height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;margin-bottom:4px}
    .goal-bar-fill{height:100%;border-radius:4px;transition:width 0.5s ease}
    .goal-bar-fill.green{background:linear-gradient(90deg,#22c55e,#16a34a)}
    .goal-bar-fill.blue{background:linear-gradient(90deg,var(--accent),#a855f7)}
    .goal-bar-fill.amber{background:linear-gradient(90deg,#f59e0b,#ef4444)}
    .goal-meta{font-size:0.7rem;color:var(--text-tertiary);display:flex;justify-content:space-between}
    .goal-input-row{display:flex;gap:8px;margin-bottom:14px}
    .goal-input-row input{flex:1;padding:8px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:0.8rem;font-family:var(--font-body);outline:none}
    .goal-input-row input:focus{border-color:var(--accent)}
    .goal-save-btn{padding:8px 16px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600}
    .ach-card{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;transition:all 0.2s}
    .ach-card.locked{opacity:0.4}
    .ach-icon{font-size:1.6rem;flex-shrink:0}
    .ach-info{flex:1}
    .ach-title{font-size:0.82rem;font-weight:600;color:var(--text-primary)}
    .ach-desc{font-size:0.7rem;color:var(--text-tertiary)}
    .ach-check{color:#22c55e;font-size:1rem}
    @media(max-width:768px){.goals-modal{max-width:98vw;max-height:92vh}}
    `;
    document.head.appendChild(style);

    let overlayEl = null, currentTab = 'goals';

    function init() {
        goals = JSON.parse(localStorage.getItem(GOALS_KEY) || '{"dailyMessages":10,"dailyMinutes":30}');
        unlocked = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]');
        createOverlay();
        // Check for nudges after a delay
        setTimeout(checkNudges, 10000);
        // Check achievements periodically
        setInterval(checkAchievements, 60000);
        console.log('[SmartNotify] Initialized');
    }

    function createOverlay() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'goals-overlay';
        overlayEl.innerHTML = `
        <div class="goals-modal">
            <div class="goals-header"><h2>🎯 Goals & Achievements</h2><button class="goals-close">✕</button></div>
            <div class="goals-tabs">
                <button class="goals-tab active" data-tab="goals">🎯 Daily Goals</button>
                <button class="goals-tab" data-tab="achievements">🏆 Achievements</button>
            </div>
            <div class="goals-body"></div>
        </div>`;
        overlayEl.querySelector('.goals-close').addEventListener('click', close);
        overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
        overlayEl.querySelectorAll('.goals-tab').forEach(t => t.addEventListener('click', () => {
            currentTab = t.dataset.tab;
            overlayEl.querySelectorAll('.goals-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
            render();
        }));
        document.body.appendChild(overlayEl);
    }

    function render() {
        const body = overlayEl.querySelector('.goals-body');
        if (currentTab === 'goals') renderGoals(body);
        else renderAchievements(body);
    }

    function renderGoals(body) {
        const todayMsgs = getTodayMessages();
        const msgGoal = goals.dailyMessages || 10;
        const msgPct = Math.min(Math.round((todayMsgs / msgGoal) * 100), 100);
        const sessions = getPomodoroToday();
        const minGoal = goals.dailyMinutes || 30;
        const minPct = Math.min(Math.round((sessions * 25 / minGoal) * 100), 100);

        body.innerHTML = `
        <div class="goal-input-row">
            <input type="number" id="goal-msgs" value="${msgGoal}" min="1" max="100" placeholder="Daily messages"/>
            <input type="number" id="goal-mins" value="${minGoal}" min="5" max="480" placeholder="Daily minutes"/>
            <button class="goal-save-btn" id="goal-save">Save</button>
        </div>
        <div class="goal-card">
            <h4>💬 Messages Today</h4>
            <div class="goal-bar"><div class="goal-bar-fill ${msgPct >= 100 ? 'green' : 'blue'}" style="width:${msgPct}%"></div></div>
            <div class="goal-meta"><span>${todayMsgs} / ${msgGoal}</span><span>${msgPct}%</span></div>
        </div>
        <div class="goal-card">
            <h4>⏱️ Study Time</h4>
            <div class="goal-bar"><div class="goal-bar-fill ${minPct >= 100 ? 'green' : 'blue'}" style="width:${minPct}%"></div></div>
            <div class="goal-meta"><span>${sessions * 25} / ${minGoal} min</span><span>${minPct}%</span></div>
        </div>
        <div class="goal-card">
            <h4>🔥 Current Streak</h4>
            <div style="font-size:1.8rem;font-weight:700;color:var(--text-primary);text-align:center;padding:6px 0">${getStreak()} days</div>
        </div>`;
        body.querySelector('#goal-save')?.addEventListener('click', () => {
            goals.dailyMessages = parseInt(document.getElementById('goal-msgs')?.value) || 10;
            goals.dailyMinutes = parseInt(document.getElementById('goal-mins')?.value) || 30;
            localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
            if (typeof Toast !== 'undefined') Toast.show('🎯 Goals saved!', 'success');
            render();
        });
    }

    function renderAchievements(body) {
        body.innerHTML = ACHIEVEMENTS.map(a => {
            const isUnlocked = unlocked.includes(a.id);
            return `<div class="ach-card${isUnlocked ? '' : ' locked'}">
                <div class="ach-icon">${a.icon}</div>
                <div class="ach-info"><div class="ach-title">${a.title}</div><div class="ach-desc">${a.desc}</div></div>
                ${isUnlocked ? '<div class="ach-check">✅</div>' : '<div style="font-size:0.7rem;color:var(--text-tertiary)">🔒</div>'}
            </div>`;
        }).join('');
    }

    function checkAchievements() {
        ACHIEVEMENTS.forEach(a => {
            if (unlocked.includes(a.id)) return;
            try {
                if (a.check()) {
                    unlocked.push(a.id);
                    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
                    if (typeof Notify !== 'undefined') Notify.showAchievement(a.icon, a.title, a.desc, 50);
                    if (typeof Toast !== 'undefined') Toast.show(`🏆 Achievement unlocked: ${a.title}!`, 'xp');
                }
            } catch {}
        });
    }

    function checkNudges() {
        const lastNudge = parseInt(localStorage.getItem(LAST_NUDGE_KEY) || '0');
        const hoursSince = (Date.now() - lastNudge) / 3600000;
        if (hoursSince < 4) return;

        const streak = getStreak();
        const todayMsgs = getTodayMessages();

        if (streak > 0 && todayMsgs === 0) {
            if (typeof Notify !== 'undefined') Notify.add('info', `🔥 ${streak}-day streak at risk!`, 'Send a message to keep it alive!', '🔥');
            localStorage.setItem(LAST_NUDGE_KEY, Date.now().toString());
        } else if (todayMsgs === 0 && hoursSince > 24) {
            if (typeof Notify !== 'undefined') Notify.add('info', 'Miss you! 👋', 'Come back and learn something new today!', '📚');
            localStorage.setItem(LAST_NUDGE_KEY, Date.now().toString());
        }
    }

    // Data helpers
    function getTotalMessages() {
        try { const c = JSON.parse(localStorage.getItem('nexus_chats') || '[]'); return c.reduce((a, ch) => a + (ch.messages?.filter(m => m.role === 'user').length || 0), 0); } catch { return 0; }
    }
    function getTodayMessages() {
        try { const log = JSON.parse(localStorage.getItem('nexus_activity_log') || '{}'); return log[new Date().toISOString().split('T')[0]] || 0; } catch { return 0; }
    }
    function getStreak() {
        try { const log = JSON.parse(localStorage.getItem('nexus_activity_log') || '{}'); let s = 0, d = new Date(); const t = d.toISOString().split('T')[0]; if (!log[t]) d.setDate(d.getDate()-1); while(true) { const k = d.toISOString().split('T')[0]; if (log[k]>0) { s++; d.setDate(d.getDate()-1); } else break; } return s; } catch { return 0; }
    }
    function getQuizCount() {
        try { return JSON.parse(localStorage.getItem('nexus_quiz_history') || '[]').length; } catch { return 0; }
    }
    function getFlashcardCount() {
        try { return JSON.parse(localStorage.getItem('nexus_flashcards') || '[]').length; } catch { return 0; }
    }
    function getCompletedTasks() {
        try { return JSON.parse(localStorage.getItem('nexus_planner_tasks') || '[]').filter(t => t.done).length; } catch { return 0; }
    }
    function getPomodoroToday() {
        try { const today = new Date().toISOString().split('T')[0]; return JSON.parse(localStorage.getItem('nexus_planner_sessions') || '[]').filter(s => s.date === today).length; } catch { return 0; }
    }

    function open() { overlayEl?.classList.add('active'); render(); }
    function close() { overlayEl?.classList.remove('active'); }

    return { init, open, close, checkAchievements };
})();
