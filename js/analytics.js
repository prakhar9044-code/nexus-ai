/* NEXUS — Usage Analytics Dashboard (Phase 12)
   Visual analytics: message charts, feature usage, session time, learning score
*/
const Analytics = (() => {
    let initialized = false;
    const STORAGE_KEY = 'nexus_analytics';

    function getState() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
            daily: {},       // { '2026-06-26': { messages: 5, sessions: 2, timeMin: 45 } }
            features: {},    // { chat: 12, mockInterview: 3 }
            topics: {},      // { 'javascript': 4, 'react': 2 }
            sessionStart: null
        };
    }

    function save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

    const style = document.createElement('style');
    style.textContent = `
    .analytics-panel{padding:24px;max-width:700px;margin:0 auto}
    .analytics-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .analytics-header h2{font-size:1.3rem;font-weight:700;display:flex;align-items:center;gap:8px}
    .analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px}
    .analytics-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center;transition:all 0.2s}
    .analytics-card:hover{transform:translateY(-2px);border-color:var(--accent)}
    .analytics-card-value{font-size:1.8rem;font-weight:800;color:var(--accent);line-height:1}
    .analytics-card-label{font-size:0.7rem;color:var(--text-tertiary);margin-top:6px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
    .analytics-section{margin-bottom:24px}
    .analytics-section-title{font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin-bottom:12px;display:flex;align-items:center;gap:6px}
    .analytics-chart{background:var(--bg-secondary);border:1px solid var(--border);border-radius:14px;padding:16px}
    .analytics-bars{display:flex;align-items:flex-end;gap:6px;height:120px;padding-top:8px}
    .analytics-bar-wrap{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%}
    .analytics-bar{width:100%;border-radius:6px 6px 0 0;background:var(--accent);min-height:2px;transition:height 0.5s cubic-bezier(0.34,1.56,0.64,1);opacity:0.85;flex-shrink:0;margin-top:auto}
    .analytics-bar:hover{opacity:1}
    .analytics-bar-count{font-size:0.6rem;font-weight:700;color:var(--text-tertiary)}
    .analytics-bar-day{font-size:0.6rem;color:var(--text-tertiary);font-weight:600}
    .analytics-feature-list{display:flex;flex-direction:column;gap:6px}
    .analytics-feature-row{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px}
    .analytics-feature-name{flex:1;font-size:0.8rem;font-weight:600;color:var(--text-primary)}
    .analytics-feature-bar{flex:2;height:6px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden}
    .analytics-feature-fill{height:100%;border-radius:4px;background:var(--accent);transition:width 0.5s ease}
    .analytics-feature-count{font-size:0.7rem;color:var(--text-tertiary);font-weight:600;min-width:30px;text-align:right}
    .analytics-topics{display:flex;flex-wrap:wrap;gap:6px}
    .analytics-topic{padding:4px 12px;background:var(--accent-alpha,rgba(74,108,247,0.08));border:1px solid var(--accent);border-radius:20px;font-size:0.72rem;font-weight:600;color:var(--accent)}
    .analytics-score{background:linear-gradient(135deg,var(--accent),#a855f7);color:#fff;border-radius:16px;padding:20px;text-align:center}
    .analytics-score-value{font-size:3rem;font-weight:800;line-height:1}
    .analytics-score-label{font-size:0.8rem;margin-top:4px;opacity:0.9}
    .analytics-score-breakdown{display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:0.7rem;opacity:0.8}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        startSession();
        trackMessages();
        console.log('[Analytics] Initialized');
    }

    function today() { return new Date().toISOString().split('T')[0]; }

    function startSession() {
        const state = getState();
        state.sessionStart = Date.now();
        save(state);
        // Track session time on unload
        window.addEventListener('beforeunload', () => {
            const s = getState();
            if (s.sessionStart) {
                const mins = Math.round((Date.now() - s.sessionStart) / 60000);
                const d = today();
                if (!s.daily[d]) s.daily[d] = { messages: 0, sessions: 0, timeMin: 0 };
                s.daily[d].timeMin += mins;
                s.daily[d].sessions++;
                s.sessionStart = null;
                save(s);
            }
        });
    }

    function trackMessages() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('user-message')) {
                        const state = getState();
                        const d = today();
                        if (!state.daily[d]) state.daily[d] = { messages: 0, sessions: 0, timeMin: 0 };
                        state.daily[d].messages++;
                        // Extract topics from user message
                        const text = node.querySelector('.message-bubble')?.textContent || '';
                        extractTopics(text, state);
                        save(state);
                    }
                });
            });
        });
        setTimeout(() => {
            const messagesArea = document.querySelector('.messages-area');
            if (messagesArea) observer.observe(messagesArea, { childList: true });
        }, 500);
    }

    function extractTopics(text, state) {
        const keywords = text.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [];
        const stopWords = new Set(['that','this','with','from','have','what','your','they','been','were','will','would','could','should','about','which','their','there','these','those','then','than','when','where','while','more','some','each','just','also','very','into','over','after','before','under','between','through','during','only','other','most','like','make','know','want','help','need','give','tell','good','well','best','much','many','last','long','does','done','going','still','back','even','both','such','same','here','come','came','take','took','been','keep','down','without']);
        const meaningful = keywords.filter(w => !stopWords.has(w) && w.length > 3);
        meaningful.slice(0, 3).forEach(w => {
            state.topics[w] = (state.topics[w] || 0) + 1;
        });
    }

    function trackFeature(featureId) {
        const state = getState();
        state.features[featureId] = (state.features[featureId] || 0) + 1;
        save(state);
    }

    function render(container) {
        if (!container) return;
        const state = getState();
        const d = today();
        const todayData = state.daily[d] || { messages: 0, sessions: 0, timeMin: 0 };

        // Calculate learning score
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
        const totalMessages = Object.values(state.daily).reduce((s, d) => s + d.messages, 0);
        const score = Math.min(100, Math.round((streak * 5) + (xp / 50) + (totalMessages / 10)));

        // Last 7 days data
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en', { weekday: 'short' });
            days.push({ key, dayName, data: state.daily[key] || { messages: 0, sessions: 0, timeMin: 0 } });
        }
        const maxMsg = Math.max(...days.map(d => d.data.messages), 1);

        // Top features
        const featureEntries = Object.entries(state.features).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const maxFeature = featureEntries.length ? featureEntries[0][1] : 1;

        // Top topics
        const topTopics = Object.entries(state.topics).sort((a, b) => b[1] - a[1]).slice(0, 12);

        let html = `<div class="analytics-panel">
            <div class="analytics-header"><h2>📊 Analytics</h2></div>

            <div class="analytics-grid">
                <div class="analytics-card"><div class="analytics-card-value">${todayData.messages}</div><div class="analytics-card-label">Messages Today</div></div>
                <div class="analytics-card"><div class="analytics-card-value">${todayData.timeMin || 0}</div><div class="analytics-card-label">Minutes Today</div></div>
                <div class="analytics-card"><div class="analytics-card-value">${totalMessages}</div><div class="analytics-card-label">Total Messages</div></div>
                <div class="analytics-card"><div class="analytics-card-value">${streak}</div><div class="analytics-card-label">Day Streak</div></div>
            </div>

            <div class="analytics-section">
                <div class="analytics-section-title">📈 Messages (Last 7 Days)</div>
                <div class="analytics-chart">
                    <div class="analytics-bars">
                        ${days.map(d => `<div class="analytics-bar-wrap">
                            <span class="analytics-bar-count">${d.data.messages}</span>
                            <div class="analytics-bar" style="height:${Math.max(2, (d.data.messages / maxMsg) * 100)}%"></div>
                            <span class="analytics-bar-day">${d.dayName}</span>
                        </div>`).join('')}
                    </div>
                </div>
            </div>

            <div class="analytics-score">
                <div class="analytics-score-value">${score}</div>
                <div class="analytics-score-label">Learning Score</div>
                <div class="analytics-score-breakdown">
                    <span>🔥 Streak: ${streak}d</span>
                    <span>⭐ XP: ${xp}</span>
                    <span>💬 Total: ${totalMessages}</span>
                </div>
            </div>`;

        if (featureEntries.length) {
            html += `<div class="analytics-section" style="margin-top:20px">
                <div class="analytics-section-title">🎯 Feature Usage</div>
                <div class="analytics-feature-list">
                    ${featureEntries.map(([name, count]) => `<div class="analytics-feature-row">
                        <span class="analytics-feature-name">${name}</span>
                        <div class="analytics-feature-bar"><div class="analytics-feature-fill" style="width:${(count / maxFeature) * 100}%"></div></div>
                        <span class="analytics-feature-count">${count}</span>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        if (topTopics.length) {
            html += `<div class="analytics-section" style="margin-top:20px">
                <div class="analytics-section-title">🧠 Top Topics</div>
                <div class="analytics-topics">
                    ${topTopics.map(([topic, count]) => `<span class="analytics-topic">${topic} (${count})</span>`).join('')}
                </div>
            </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    return { init, render, trackFeature };
})();
