/* ============================================
   NEXUS — Progress Dashboard v2
   Phase 15.3: Skill tree, weekly report, time heatmap
   ============================================ */
const Progress = (() => {
    const style = document.createElement('style');
    style.textContent = `
    .progress-overlay{position:fixed;inset:0;z-index:9655;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .progress-overlay.active{opacity:1;visibility:visible}
    .progress-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:580px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .progress-overlay.active .progress-modal{transform:scale(1)}
    .progress-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .progress-header h2{font-size:1rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .progress-close{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:6px;border-radius:8px;font-size:1.1rem}
    .progress-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .progress-body{flex:1;overflow-y:auto;padding:16px 20px}
    .progress-section{margin-bottom:20px}
    .progress-section h3{font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px}
    .progress-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
    .progress-compare-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center}
    .progress-compare-card h4{font-size:0.7rem;color:var(--text-tertiary);margin-bottom:4px;font-weight:500}
    .progress-compare-val{font-size:1.5rem;font-weight:700;color:var(--text-primary)}
    .progress-compare-trend{font-size:0.7rem;margin-top:2px}
    .progress-compare-trend.up{color:#22c55e}
    .progress-compare-trend.down{color:#ef4444}
    .progress-compare-trend.same{color:var(--text-tertiary)}
    .mastery-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .mastery-label{width:90px;font-size:0.75rem;color:var(--text-secondary);font-weight:500;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mastery-track{flex:1;height:10px;background:var(--bg-tertiary);border-radius:5px;overflow:hidden}
    .mastery-fill{height:100%;border-radius:5px;transition:width 0.6s ease}
    .mastery-pct{width:36px;font-size:0.7rem;color:var(--text-tertiary);font-weight:600}
    .heatmap-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:12px}
    .heatmap-label{font-size:0.6rem;color:var(--text-tertiary);text-align:center;font-weight:500;padding:4px 0}
    .heatmap-cells{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
    .heatmap-cell{aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.55rem;color:var(--text-tertiary);font-weight:600;position:relative;cursor:pointer;transition:transform 0.15s}
    .heatmap-cell:hover{transform:scale(1.15)}
    .hm-l0{background:var(--bg-tertiary)}
    .hm-l1{background:rgba(74,108,247,0.15);color:var(--accent)}
    .hm-l2{background:rgba(74,108,247,0.3);color:var(--accent)}
    .hm-l3{background:rgba(74,108,247,0.5);color:#fff}
    .hm-l4{background:rgba(74,108,247,0.75);color:#fff}
    .skill-tree{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    .skill-node{padding:6px 12px;border-radius:var(--radius-full);font-size:0.72rem;font-weight:500;border:2px solid;transition:all 0.2s;cursor:default}
    .skill-node.mastered{background:rgba(34,197,94,0.15);border-color:#22c55e;color:#22c55e}
    .skill-node.learning{background:rgba(74,108,247,0.15);border-color:var(--accent);color:var(--accent)}
    .skill-node.beginner{background:rgba(245,158,11,0.15);border-color:#f59e0b;color:#f59e0b}
    @media(max-width:768px){.progress-modal{max-width:98vw;max-height:92vh}.progress-compare{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    let overlayEl = null;

    function init() {
        createOverlay();
        console.log('[Progress] Initialized');
    }

    function createOverlay() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'progress-overlay';
        overlayEl.innerHTML = `
        <div class="progress-modal">
            <div class="progress-header"><h2>📈 Progress Dashboard</h2><button class="progress-close">✕</button></div>
            <div class="progress-body"></div>
        </div>`;
        overlayEl.querySelector('.progress-close').addEventListener('click', close);
        overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
        document.body.appendChild(overlayEl);
    }

    function open() { overlayEl?.classList.add('active'); render(); }
    function close() { overlayEl?.classList.remove('active'); }

    function render() {
        const body = overlayEl.querySelector('.progress-body');
        const activity = getActivity();
        const thisWeek = getWeekStats(0, activity);
        const lastWeek = getWeekStats(1, activity);
        const topics = getTopics();
        const hourData = getHourDistribution(activity);

        body.innerHTML = `
            ${renderComparison(thisWeek, lastWeek)}
            ${renderTopicMastery(topics)}
            ${renderTimeHeatmap(hourData)}
            ${renderSkillTree(topics)}
        `;
    }

    function renderComparison(tw, lw) {
        const msgTrend = tw.messages > lw.messages ? 'up' : tw.messages < lw.messages ? 'down' : 'same';
        const dayTrend = tw.activeDays > lw.activeDays ? 'up' : tw.activeDays < lw.activeDays ? 'down' : 'same';
        const arrows = { up: '↑', down: '↓', same: '→' };
        const diffs = { up: '+', down: '', same: '' };

        return `<div class="progress-section"><h3>📊 This Week vs Last Week</h3>
        <div class="progress-compare">
            <div class="progress-compare-card"><h4>Messages</h4><div class="progress-compare-val">${tw.messages}</div><div class="progress-compare-trend ${msgTrend}">${arrows[msgTrend]} ${diffs[msgTrend]}${tw.messages - lw.messages} vs last week</div></div>
            <div class="progress-compare-card"><h4>Active Days</h4><div class="progress-compare-val">${tw.activeDays}/7</div><div class="progress-compare-trend ${dayTrend}">${arrows[dayTrend]} ${diffs[dayTrend]}${tw.activeDays - lw.activeDays} vs last week</div></div>
        </div></div>`;
    }

    function renderTopicMastery(topics) {
        if (!topics.length) return `<div class="progress-section"><h3>📚 Topic Mastery</h3><div style="text-align:center;padding:16px;color:var(--text-tertiary);font-size:0.82rem">Chat more to see topic progress!</div></div>`;
        const max = topics[0].count;
        const colors = ['#4a6cf7','#a855f7','#ec4899','#f59e0b','#22c55e','#06b6d4','#8b5cf6','#f43f5e'];
        const bars = topics.slice(0, 8).map((t, i) => {
            const pct = Math.round((t.count / max) * 100);
            return `<div class="mastery-bar-row"><div class="mastery-label">${t.word}</div><div class="mastery-track"><div class="mastery-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div></div><div class="mastery-pct">${pct}%</div></div>`;
        }).join('');
        return `<div class="progress-section"><h3>📚 Topic Mastery</h3>${bars}</div>`;
    }

    function renderTimeHeatmap(hourData) {
        const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const timeLabels = ['Morning<br>6-12', 'Afternoon<br>12-18', 'Evening<br>18-24', 'Night<br>0-6'];
        const max = Math.max(...Object.values(hourData), 1);

        let cells = '';
        for (let t = 0; t < 4; t++) {
            for (let d = 0; d < 7; d++) {
                const key = `${d}_${t}`;
                const val = hourData[key] || 0;
                const level = val === 0 ? 0 : val <= max * 0.25 ? 1 : val <= max * 0.5 ? 2 : val <= max * 0.75 ? 3 : 4;
                cells += `<div class="heatmap-cell hm-l${level}" title="${dayLabels[d]} ${timeLabels[t].replace('<br>',' ')}: ${val} msgs">${val || ''}</div>`;
            }
        }

        return `<div class="progress-section"><h3>⏰ When You Study</h3>
        <div class="heatmap-grid">
            ${dayLabels.map(d => `<div class="heatmap-label">${d}</div>`).join('')}
            ${cells}
        </div></div>`;
    }

    function renderSkillTree(topics) {
        if (!topics.length) return '';
        const max = topics[0].count;
        const nodes = topics.slice(0, 15).map(t => {
            const level = t.count >= max * 0.6 ? 'mastered' : t.count >= max * 0.3 ? 'learning' : 'beginner';
            return `<span class="skill-node ${level}">${t.word}</span>`;
        }).join('');
        return `<div class="progress-section"><h3>🌳 Skill Tree</h3><div class="skill-tree">${nodes}</div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:10px;font-size:0.65rem;color:var(--text-tertiary)">
            <span><span class="skill-node mastered" style="padding:2px 6px;font-size:0.6rem">●</span> Mastered</span>
            <span><span class="skill-node learning" style="padding:2px 6px;font-size:0.6rem">●</span> Learning</span>
            <span><span class="skill-node beginner" style="padding:2px 6px;font-size:0.6rem">●</span> Beginner</span>
        </div></div>`;
    }

    // Data helpers
    function getActivity() {
        try { return JSON.parse(localStorage.getItem('nexus_activity_log') || '{}'); } catch { return {}; }
    }

    function getWeekStats(weeksAgo, activity) {
        const now = new Date();
        const start = new Date(now); start.setDate(start.getDate() - start.getDay() + 1 - (weeksAgo * 7));
        let messages = 0, activeDays = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(start); d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            const count = activity[key] || 0;
            messages += count;
            if (count > 0) activeDays++;
        }
        return { messages, activeDays };
    }

    function getTopics() {
        const STOP = new Set(['the','a','an','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','to','of','in','for','on','with','at','by','from','as','into','through','but','and','or','if','about','it','its','i','me','my','you','your','he','she','we','they','this','that','what','which','who','how','not','can','also','like','just','get','know','make','think','go','see','come','want','look','use','find','give','tell','work','say','said','really','much','way','new','one','two','thing','please','help','write','code','create','show','nexus']);
        try {
            const chats = JSON.parse(localStorage.getItem('nexus_chats') || '[]');
            const freq = {};
            chats.forEach(c => (c.messages || []).forEach(m => {
                if (m.role !== 'user') return;
                (m.text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).forEach(w => {
                    if (w.length > 2 && !STOP.has(w)) freq[w] = (freq[w] || 0) + 1;
                });
            }));
            return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([word, count]) => ({ word, count }));
        } catch { return []; }
    }

    function getHourDistribution(activity) {
        // Simplified: distribute based on current usage patterns
        const dist = {};
        try {
            const chats = JSON.parse(localStorage.getItem('nexus_chats') || '[]');
            chats.forEach(c => (c.messages || []).forEach(m => {
                if (!m.time) return;
                const d = new Date(m.time);
                const day = (d.getDay() + 6) % 7; // Mon=0
                const timeSlot = d.getHours() < 6 ? 3 : d.getHours() < 12 ? 0 : d.getHours() < 18 ? 1 : 2;
                const key = `${day}_${timeSlot}`;
                dist[key] = (dist[key] || 0) + 1;
            }));
        } catch {}
        return dist;
    }

    return { init, open, close };
})();
