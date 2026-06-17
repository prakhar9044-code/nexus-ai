/* NEXUS — Streak Challenges (Phase 11)
   Daily/weekly challenges with XP rewards, progress tracking, confetti
*/
const Challenges = (() => {
    let initialized = false;
    let state = JSON.parse(localStorage.getItem('nexus_challenges') || 'null');

    const DAILY = [
        { id: 'ask5', name: 'Ask 5 questions', desc: 'Send 5 messages today', target: 5, xp: 15, icon: '💬' },
        { id: 'focus1', name: 'Complete a focus session', desc: 'Finish one Pomodoro', target: 1, xp: 20, icon: '⏱️' },
        { id: 'tryFeature', name: 'Explore a feature', desc: 'Use any feature panel', target: 1, xp: 10, icon: '🧭' },
        { id: 'persona', name: 'Switch persona', desc: 'Try a different AI persona', target: 1, xp: 10, icon: '🎭' },
        { id: 'bookmark', name: 'Bookmark a message', desc: 'Star a helpful response', target: 1, xp: 10, icon: '⭐' },
        { id: 'ask10', name: 'Power User', desc: 'Send 10 messages today', target: 10, xp: 25, icon: '🔥' },
    ];

    const WEEKLY = [
        { id: 'streak7', name: '7-Day Streak', desc: 'Use Nexus 7 days in a row', target: 7, xp: 100, icon: '🔥' },
        { id: 'allPersonas', name: 'Persona Explorer', desc: 'Try all 6 AI personas', target: 6, xp: 60, icon: '🎭' },
        { id: 'focus10', name: 'Focus Master', desc: 'Complete 10 focus sessions', target: 10, xp: 80, icon: '⏱️' },
        { id: 'messages50', name: 'Conversationalist', desc: 'Send 50 messages this week', target: 50, xp: 50, icon: '💬' },
    ];

    const style = document.createElement('style');
    style.textContent = `
    .challenges-panel{padding:24px;max-width:600px;margin:0 auto}
    .challenges-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .challenges-header h2{font-size:1.3rem;font-weight:700;display:flex;align-items:center;gap:8px}
    .challenges-section{margin-bottom:24px}
    .challenges-section-title{font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px}
    .challenge-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:14px;padding:14px 16px;margin-bottom:8px;transition:all 0.2s}
    .challenge-card:hover{border-color:var(--accent);transform:translateX(4px)}
    .challenge-card.completed{opacity:0.6;border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.05)}
    .challenge-top{display:flex;align-items:center;gap:10px}
    .challenge-icon{font-size:1.3rem;flex-shrink:0}
    .challenge-info{flex:1;min-width:0}
    .challenge-name{font-size:0.85rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px}
    .challenge-desc{font-size:0.72rem;color:var(--text-tertiary);margin-top:2px}
    .challenge-xp{font-size:0.72rem;font-weight:700;color:var(--accent);background:var(--accent-alpha, rgba(74,108,247,0.1));padding:3px 10px;border-radius:12px;flex-shrink:0}
    .challenge-progress{margin-top:8px;display:flex;align-items:center;gap:8px}
    .challenge-bar{flex:1;height:5px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden}
    .challenge-bar-fill{height:100%;background:var(--accent);border-radius:4px;transition:width 0.5s ease}
    .challenge-bar-fill.complete{background:linear-gradient(90deg,#22c55e,#06b6d4)}
    .challenge-count{font-size:0.68rem;color:var(--text-tertiary);font-weight:600;flex-shrink:0}
    .challenge-check{font-size:1rem;color:#22c55e}
    .challenge-streak-multiplier{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:8px 16px;border-radius:12px;font-size:0.78rem;font-weight:700;text-align:center;margin-bottom:16px}
    .confetti-container{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;overflow:hidden}
    .confetti{position:absolute;width:8px;height:8px;border-radius:2px;top:-10px;animation:confettiFall 3s ease-in forwards}
    @keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        initState();
        trackActivity();
        console.log('[Challenges] Initialized');
    }

    function initState() {
        const today = new Date().toDateString();
        const weekStart = getWeekStart();

        if (!state || state.day !== today) {
            // Pick 3 random daily challenges
            const shuffled = [...DAILY].sort(() => Math.random() - 0.5);
            const picked = shuffled.slice(0, 3);
            state = {
                day: today,
                weekStart: state?.weekStart === weekStart ? state.weekStart : weekStart,
                daily: picked.map(c => ({ ...c, progress: 0, completed: false })),
                weekly: state?.weekStart === weekStart && state.weekly
                    ? state.weekly
                    : WEEKLY.map(c => ({ ...c, progress: 0, completed: false })),
                totalCompleted: state?.totalCompleted || 0
            };
            save();
        }
    }

    function getWeekStart() {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        return d.toDateString();
    }

    function save() {
        localStorage.setItem('nexus_challenges', JSON.stringify(state));
    }

    function trackActivity() {
        // Track messages sent
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('user-message')) {
                        incrementDaily('ask5', 1);
                        incrementDaily('ask10', 1);
                        incrementWeekly('messages50', 1);
                    }
                });
            });
        });
        const messagesArea = document.querySelector('.messages-area');
        if (messagesArea) observer.observe(messagesArea, { childList: true });
    }

    function incrementDaily(id, amount) {
        if (!state) return;
        const ch = state.daily.find(c => c.id === id);
        if (!ch || ch.completed) return;
        ch.progress = Math.min(ch.progress + amount, ch.target);
        if (ch.progress >= ch.target) {
            ch.completed = true;
            state.totalCompleted++;
            if (typeof Engage !== 'undefined' && Engage.addXP) Engage.addXP(ch.xp);
            Toast.show(`🏆 Challenge complete: ${ch.name} (+${ch.xp} XP)`, 'xp');
            fireConfetti();
        }
        save();
    }

    function incrementWeekly(id, amount) {
        if (!state) return;
        const ch = state.weekly.find(c => c.id === id);
        if (!ch || ch.completed) return;
        ch.progress = Math.min(ch.progress + amount, ch.target);
        if (ch.progress >= ch.target) {
            ch.completed = true;
            state.totalCompleted++;
            if (typeof Engage !== 'undefined' && Engage.addXP) Engage.addXP(ch.xp);
            Toast.show(`🏆 Weekly challenge: ${ch.name} (+${ch.xp} XP)`, 'xp');
            fireConfetti();
        }
        save();
    }

    function fireConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
        for (let i = 0; i < 50; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + '%';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = Math.random() * 1 + 's';
            c.style.animationDuration = (2 + Math.random() * 2) + 's';
            c.style.width = (5 + Math.random() * 8) + 'px';
            c.style.height = (5 + Math.random() * 8) + 'px';
            container.appendChild(c);
        }
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 4000);
    }

    function render(container) {
        if (!container || !state) return;
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const multiplier = streak >= 7 ? '2x' : '1x';

        let html = `<div class="challenges-panel">
            <div class="challenges-header">
                <h2>🏆 Challenges</h2>
                <span style="font-size:0.75rem;color:var(--text-tertiary)">${state.totalCompleted} completed all time</span>
            </div>`;

        if (streak >= 7) {
            html += `<div class="challenge-streak-multiplier">🔥 ${streak}-day streak! 2x XP multiplier active!</div>`;
        }

        // Daily
        html += `<div class="challenges-section">
            <div class="challenges-section-title">📅 Daily Challenges</div>`;
        state.daily.forEach(ch => {
            const pct = Math.min((ch.progress / ch.target) * 100, 100);
            html += `<div class="challenge-card ${ch.completed ? 'completed' : ''}">
                <div class="challenge-top">
                    <span class="challenge-icon">${ch.icon}</span>
                    <div class="challenge-info">
                        <div class="challenge-name">${ch.name} ${ch.completed ? '<span class="challenge-check">✓</span>' : ''}</div>
                        <div class="challenge-desc">${ch.desc}</div>
                    </div>
                    <span class="challenge-xp">+${ch.xp} XP</span>
                </div>
                <div class="challenge-progress">
                    <div class="challenge-bar"><div class="challenge-bar-fill ${ch.completed ? 'complete' : ''}" style="width:${pct}%"></div></div>
                    <span class="challenge-count">${ch.progress}/${ch.target}</span>
                </div>
            </div>`;
        });
        html += `</div>`;

        // Weekly
        html += `<div class="challenges-section">
            <div class="challenges-section-title">📆 Weekly Challenges</div>`;
        state.weekly.forEach(ch => {
            const pct = Math.min((ch.progress / ch.target) * 100, 100);
            html += `<div class="challenge-card ${ch.completed ? 'completed' : ''}">
                <div class="challenge-top">
                    <span class="challenge-icon">${ch.icon}</span>
                    <div class="challenge-info">
                        <div class="challenge-name">${ch.name} ${ch.completed ? '<span class="challenge-check">✓</span>' : ''}</div>
                        <div class="challenge-desc">${ch.desc}</div>
                    </div>
                    <span class="challenge-xp">+${ch.xp} XP</span>
                </div>
                <div class="challenge-progress">
                    <div class="challenge-bar"><div class="challenge-bar-fill ${ch.completed ? 'complete' : ''}" style="width:${pct}%"></div></div>
                    <span class="challenge-count">${ch.progress}/${ch.target}</span>
                </div>
            </div>`;
        });
        html += `</div></div>`;

        container.innerHTML = html;
    }

    return { init, render, incrementDaily, incrementWeekly, fireConfetti };
})();
