/* ============================================
   NEXUS — Conversation Insights
   Phase 14.5: Topic cloud, streak calendar, engagement score
   ============================================ */
const Insights = (() => {
    const ACTIVITY_KEY = 'nexus_activity_log';
    const STOP_WORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','need','dare','to','of','in','for','on','with','at','by','from','as','into','through','during','before','after','above','below','between','out','off','over','under','again','further','then','once','here','there','when','where','why','how','all','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','just','because','but','and','or','if','while','about','it','its','i','me','my','you','your','he','she','we','they','them','their','this','that','these','those','what','which','who','whom','up','down','get','got','go','went','make','made','know','think','take','see','come','want','look','use','find','give','tell','work','call','try','ask','put','let','say','said','like','also','well','back','much','way','even','new','one','two','many','any','thing','things','really','right','still','already','now','something','anything','everything','nothing','please','help','explain','write','code','create','show','describe']);

    const style = document.createElement('style');
    style.textContent = `
    .insights-overlay{position:fixed;inset:0;z-index:9650;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .insights-overlay.active{opacity:1;visibility:visible}
    .insights-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:560px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .insights-overlay.active .insights-modal{transform:scale(1)}
    .insights-header{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .insights-header h2{font-size:1.05rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .insights-close{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:6px;border-radius:8px;font-size:1.1rem;transition:all 0.2s}
    .insights-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .insights-body{flex:1;overflow-y:auto;padding:16px 20px}
    .insights-section{margin-bottom:20px}
    .insights-section h3{font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px}
    .insights-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px}
    .insights-stat{background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:12px 10px;text-align:center}
    .insights-stat-val{font-size:1.3rem;font-weight:700;color:var(--text-primary)}
    .insights-stat-label{font-size:0.65rem;color:var(--text-tertiary);margin-top:2px}
    .topic-cloud{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:8px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;min-height:60px}
    .topic-word{padding:4px 10px;border-radius:var(--radius-full);cursor:pointer;transition:all 0.2s;font-family:var(--font-body);font-weight:500}
    .topic-word:hover{transform:scale(1.1);filter:brightness(1.2)}
    .streak-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;padding:8px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px}
    .streak-day{width:100%;aspect-ratio:1;border-radius:3px;background:var(--bg-tertiary);position:relative;cursor:pointer;transition:all 0.15s}
    .streak-day:hover{transform:scale(1.3);z-index:1}
    .streak-day[title]:hover::after{content:attr(title);position:absolute;bottom:110%;left:50%;transform:translateX(-50%);background:var(--bg-primary);border:1px solid var(--border);padding:3px 8px;border-radius:6px;font-size:0.6rem;white-space:nowrap;z-index:10;color:var(--text-primary);box-shadow:var(--shadow-md)}
    .streak-l1{background:rgba(74,108,247,0.2)}
    .streak-l2{background:rgba(74,108,247,0.4)}
    .streak-l3{background:rgba(74,108,247,0.6)}
    .streak-l4{background:rgba(74,108,247,0.85)}
    .engagement-gauge{display:flex;align-items:center;gap:16px;padding:14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px}
    .gauge-circle{position:relative;width:80px;height:80px;flex-shrink:0}
    .gauge-circle svg{width:80px;height:80px;transform:rotate(-90deg)}
    .gauge-circle circle{fill:none;stroke-width:6;stroke-linecap:round}
    .gauge-circle .gbg{stroke:var(--border)}
    .gauge-circle .gfg{stroke:var(--accent);transition:stroke-dashoffset 0.8s ease}
    .gauge-val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;color:var(--text-primary)}
    .gauge-info{flex:1}
    .gauge-label{font-size:0.85rem;font-weight:600;color:var(--text-primary)}
    .gauge-sub{font-size:0.72rem;color:var(--text-tertiary);margin-top:2px}
    .streak-count-row{display:flex;justify-content:space-between;padding:6px 0;font-size:0.75rem;color:var(--text-secondary)}
    @media(max-width:768px){.insights-modal{max-width:98vw;max-height:92vh}.insights-stats-row{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(style);

    let overlayEl = null;

    function init() {
        createOverlay();
        console.log('[Insights] Initialized');
    }

    function createOverlay() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'insights-overlay';
        overlayEl.innerHTML = `
        <div class="insights-modal">
            <div class="insights-header"><h2>📊 Conversation Insights</h2><button class="insights-close">✕</button></div>
            <div class="insights-body"></div>
        </div>`;
        overlayEl.querySelector('.insights-close').addEventListener('click', close);
        overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
        document.body.appendChild(overlayEl);
    }

    function open() {
        overlayEl?.classList.add('active');
        render();
    }
    function close() { overlayEl?.classList.remove('active'); }

    function render() {
        const body = overlayEl.querySelector('.insights-body');
        const chats = getAllChats();
        const messages = extractAllMessages(chats);
        const activity = getActivityLog();
        const streak = calcStreak(activity);
        const score = calcEngagement(activity, messages, chats);

        body.innerHTML = `
            ${renderQuickStats(messages, chats, streak)}
            ${renderEngagement(score)}
            ${renderStreakCalendar(activity)}
            ${renderTopicCloud(messages)}
        `;
    }

    function renderQuickStats(messages, chats, streak) {
        const userMsgs = messages.filter(m => m.role === 'user');
        const days = Object.keys(getActivityLog());
        const avgPerChat = chats.length ? Math.round(messages.length / chats.length) : 0;
        const dayCounts = {};
        userMsgs.forEach(m => { if(m.day) dayCounts[m.day] = (dayCounts[m.day]||0)+1; });
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const mostActiveDay = Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];

        return `<div class="insights-stats-row">
            <div class="insights-stat"><div class="insights-stat-val">${userMsgs.length}</div><div class="insights-stat-label">Messages</div></div>
            <div class="insights-stat"><div class="insights-stat-val">${chats.length}</div><div class="insights-stat-label">Chats</div></div>
            <div class="insights-stat"><div class="insights-stat-val">${avgPerChat}</div><div class="insights-stat-label">Avg/Chat</div></div>
            <div class="insights-stat"><div class="insights-stat-val">${streak}🔥</div><div class="insights-stat-label">Streak</div></div>
        </div>`;
    }

    function renderEngagement(score) {
        const circ = 2 * Math.PI * 34;
        const offset = circ * (1 - score / 100);
        const level = score >= 80 ? '🔥 On Fire' : score >= 60 ? '⚡ Active' : score >= 40 ? '👍 Growing' : '🌱 Getting Started';
        return `<div class="insights-section"><h3>💪 Engagement Score</h3>
            <div class="engagement-gauge">
                <div class="gauge-circle"><svg viewBox="0 0 80 80"><circle class="gbg" cx="40" cy="40" r="34"/><circle class="gfg" cx="40" cy="40" r="34" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg><div class="gauge-val">${score}</div></div>
                <div class="gauge-info"><div class="gauge-label">${level}</div><div class="gauge-sub">Based on streak, activity, and feature usage</div></div>
            </div>
        </div>`;
    }

    function renderStreakCalendar(activity) {
        const days = [];
        for (let i = 83; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = activity[key] || 0;
            const level = count === 0 ? '' : count <= 3 ? 'streak-l1' : count <= 8 ? 'streak-l2' : count <= 15 ? 'streak-l3' : 'streak-l4';
            const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            days.push(`<div class="streak-day ${level}" title="${dateStr}: ${count} msgs"></div>`);
        }
        return `<div class="insights-section"><h3>📅 Activity (12 weeks)</h3>
            <div class="streak-grid">${days.join('')}</div>
            <div class="streak-count-row"><span>Less</span><span style="display:flex;gap:3px">
                <span style="width:12px;height:12px;border-radius:2px;background:var(--bg-tertiary)"></span>
                <span style="width:12px;height:12px;border-radius:2px" class="streak-l1"></span>
                <span style="width:12px;height:12px;border-radius:2px" class="streak-l2"></span>
                <span style="width:12px;height:12px;border-radius:2px" class="streak-l3"></span>
                <span style="width:12px;height:12px;border-radius:2px" class="streak-l4"></span>
            </span><span>More</span></div>
        </div>`;
    }

    function renderTopicCloud(messages) {
        const userMsgs = messages.filter(m => m.role === 'user').map(m => m.text);
        const freq = {};
        userMsgs.forEach(text => {
            text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).forEach(w => {
                if (w.length > 2 && !STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
            });
        });
        const sorted = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 20);
        if (!sorted.length) return `<div class="insights-section"><h3>🏷️ Topics</h3><div class="topic-cloud" style="justify-content:center;padding:20px"><span style="color:var(--text-tertiary);font-size:0.82rem">Chat more to see your topics!</span></div></div>`;
        const maxCount = sorted[0][1];
        const colors = ['#4a6cf7','#a855f7','#ec4899','#f59e0b','#22c55e','#06b6d4','#8b5cf6','#f43f5e'];
        const words = sorted.map(([word, count], i) => {
            const size = 0.7 + (count / maxCount) * 0.7;
            const color = colors[i % colors.length];
            return `<span class="topic-word" style="font-size:${size}rem;color:${color};background:${color}15">${word}</span>`;
        }).join('');
        return `<div class="insights-section"><h3>🏷️ Top Topics</h3><div class="topic-cloud">${words}</div></div>`;
    }

    // ---- Data helpers ----
    function getAllChats() {
        try {
            const raw = localStorage.getItem('nexus_chats');
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    function extractAllMessages(chats) {
        const msgs = [];
        chats.forEach(chat => {
            (chat.messages || []).forEach(m => {
                const d = m.time ? new Date(m.time) : new Date();
                msgs.push({ role: m.role, text: m.text || '', day: d.getDay(), date: d.toISOString().split('T')[0] });
            });
        });
        return msgs;
    }

    function getActivityLog() {
        try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}'); } catch { return {}; }
    }

    function trackMessage() {
        const log = getActivityLog();
        const today = new Date().toISOString().split('T')[0];
        log[today] = (log[today] || 0) + 1;
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
    }

    function calcStreak(activity) {
        let streak = 0;
        const d = new Date();
        // Check today first
        const todayKey = d.toISOString().split('T')[0];
        if (!activity[todayKey]) {
            // Check if yesterday had activity (streak still alive)
            d.setDate(d.getDate() - 1);
        }
        while (true) {
            const key = d.toISOString().split('T')[0];
            if (activity[key] && activity[key] > 0) { streak++; d.setDate(d.getDate() - 1); }
            else break;
        }
        return streak;
    }

    function calcEngagement(activity, messages, chats) {
        const streak = calcStreak(activity);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const weekKey = weekAgo.toISOString().split('T')[0];
        let weekMsgs = 0;
        Object.entries(activity).forEach(([k, v]) => { if (k >= weekKey) weekMsgs += v; });
        const streakScore = Math.min(streak * 5, 30);
        const msgScore = Math.min(weekMsgs * 1.5, 25);
        const chatScore = Math.min(chats.length * 2, 20);
        const totalScore = Math.min(Math.round(streakScore + msgScore + chatScore + 10), 100);
        return totalScore;
    }

    return { init, open, close, trackMessage };
})();
