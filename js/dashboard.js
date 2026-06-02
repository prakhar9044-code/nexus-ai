/* NEXUS v5.0 — Career Dashboard Engine
   Phase 5+8: Full analytics dashboard with XP trends, skill radar,
   mission progress, session history, career profile, AI insights,
   streak heatmap, satisfaction metrics, and peak hours.
   Pulls data from Memory, Missions, Agent State, and localStorage.
*/
const Dashboard = (() => {

    // ---- XP Trend Data (last 7 days) ----
    function getXPTrend() {
        const log = JSON.parse(localStorage.getItem('nexus_xp_log') || '[]');
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toDateString();
            const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en', { weekday: 'short' });
            const dayXP = log.filter(e => {
                try { return new Date(e.time).toDateString() === key; } catch { return false; }
            }).reduce((s, e) => s + (e.xp || 0), 0);
            days.push({ label, xp: dayXP });
        }
        return days;
    }

    // ---- Skill Radar Data (from Memory) ----
    function getSkillRadar() {
        const profile = (typeof Memory !== 'undefined') ? Memory.getProfile() : null;
        const strengths = profile?.strengths || [];
        const weaknesses = profile?.weaknesses || [];
        const defaultSkills = [
            { name: 'DSA', score: 40 },
            { name: 'System Design', score: 25 },
            { name: 'Frontend', score: 60 },
            { name: 'Backend', score: 45 },
            { name: 'Communication', score: 55 },
            { name: 'Problem Solving', score: 50 },
        ];
        return defaultSkills.map(s => {
            let score = s.score;
            if (strengths.some(st => st.toLowerCase().includes(s.name.toLowerCase()))) score = Math.min(score + 30, 95);
            if (weaknesses.some(w => w.toLowerCase().includes(s.name.toLowerCase()))) score = Math.max(score - 20, 10);
            return { ...s, score };
        });
    }

    // ---- Session Stats ----
    function getSessionStats() {
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const chatArr = Object.values(chats).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const totalMsgs = chatArr.reduce((s, c) => s + (c.messages?.length || 0), 0);
        const totalChats = chatArr.length;
        const estMinutes = Math.round(totalMsgs * 0.5);
        return { totalChats, totalMsgs, estMinutes, recent: chatArr.slice(0, 5) };
    }

    // ---- Feature Usage Breakdown ----
    function getFeatureUsage() {
        const features = [
            { id: 'chat', name: 'AI Chat', icon: '💬', color: '#4a6cf7' },
            { id: 'mockInterview', name: 'Mock Interview', icon: '🎤', color: '#ef4444' },
            { id: 'aiTeacher', name: 'AI Teacher', icon: '👨‍🏫', color: '#22c55e' },
            { id: 'codingArena', name: 'Coding Arena', icon: '💻', color: '#ec4899' },
            { id: 'careerPath', name: 'Career Path', icon: '🎯', color: '#f59e0b' },
            { id: 'resumeBuilder', name: 'Resume Builder', icon: '📄', color: '#a855f7' },
            { id: 'skillAnalyzer', name: 'Skill Analysis', icon: '📊', color: '#06b6d4' },
            { id: 'realityCheck', name: 'Reality Check', icon: '⚡', color: '#84cc16' },
        ];
        return features.map(f => {
            const conv = (typeof Nexus !== 'undefined') ? Nexus.getConversation(f.id) : [];
            return { ...f, messages: conv.length };
        }).sort((a, b) => b.messages - a.messages);
    }

    // ---- Career Profile Summary ----
    function getCareerProfile() {
        const profile = (typeof Memory !== 'undefined') ? Memory.getProfile() : null;
        return {
            goals: profile?.goals || [],
            targetCompanies: profile?.target_companies || [],
            careerPath: profile?.career_path || 'Not set',
            strengths: profile?.strengths || [],
            weaknesses: profile?.weaknesses || [],
            interests: profile?.interests || [],
            interactionCount: profile?.interaction_count || 0,
            recentTopics: profile?.recent_topics || [],
            facts: profile?.facts || [],
        };
    }

    // ---- Streak Heatmap Data (last 12 weeks) ----
    function getStreakHeatmap() {
        const log = JSON.parse(localStorage.getItem('nexus_xp_log') || '[]');
        const visitLog = JSON.parse(localStorage.getItem('nexus_visit_log') || '[]');
        const cells = [];
        for (let i = 83; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toDateString();
            const dayXP = log.filter(e => {
                try { return new Date(e.time).toDateString() === key; } catch { return false; }
            }).reduce((s, e) => s + (e.xp || 0), 0);
            const visited = visitLog.some(v => {
                try { return new Date(v).toDateString() === key; } catch { return false; }
            });
            let intensity = 0;
            if (dayXP > 0 || visited) intensity = 1;
            if (dayXP >= 20) intensity = 2;
            if (dayXP >= 50) intensity = 3;
            if (dayXP >= 100) intensity = 4;
            cells.push({
                date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
                xp: dayXP,
                intensity
            });
        }
        return cells;
    }

    // ---- Satisfaction Metrics (from reactions) ----
    function getSatisfactionMetrics() {
        const reactions = JSON.parse(localStorage.getItem('nexus_reactions') || '{}');
        let thumbsUp = 0, thumbsDown = 0;
        Object.values(reactions).forEach(r => {
            if (r === 'up' || r === '👍') thumbsUp++;
            if (r === 'down' || r === '👎') thumbsDown++;
        });
        const total = thumbsUp + thumbsDown;
        const satisfactionRate = total > 0 ? Math.round((thumbsUp / total) * 100) : 0;
        return { thumbsUp, thumbsDown, total, satisfactionRate };
    }

    // ---- Peak Usage Hours ----
    function getPeakHours() {
        const log = JSON.parse(localStorage.getItem('nexus_xp_log') || '[]');
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const hours = new Array(24).fill(0);
        // Count from XP log
        log.forEach(e => {
            try {
                const h = new Date(e.time).getHours();
                hours[h]++;
            } catch {}
        });
        // Count from chat messages
        Object.values(chats).forEach(chat => {
            (chat.messages || []).forEach(m => {
                try {
                    const h = new Date(m.time).getHours();
                    hours[h]++;
                } catch {}
            });
        });
        return hours;
    }

    // ---- Render XP Trend Chart (Pure CSS/SVG bars) ----
    function renderXPChart(trend) {
        const maxXP = Math.max(...trend.map(d => d.xp), 10);
        const bars = trend.map((d, i) => {
            const pct = Math.max((d.xp / maxXP) * 100, 3);
            const isToday = d.label === 'Today';
            return `
            <div class="dash-bar-col" style="animation-delay:${i * 80}ms">
                <div class="dash-bar-value">${d.xp > 0 ? '+' + d.xp : '0'}</div>
                <div class="dash-bar-track">
                    <div class="dash-bar-fill ${isToday ? 'dash-bar-today' : ''}" style="height:${pct}%"></div>
                </div>
                <div class="dash-bar-label">${d.label}</div>
            </div>`;
        }).join('');
        return `<div class="dash-chart">${bars}</div>`;
    }

    // ---- Render Skill Radar (Pure CSS) ----
    function renderSkillRadar(skills) {
        const rows = skills.map(s => {
            const color = s.score >= 70 ? 'var(--green)' : s.score >= 40 ? 'var(--accent)' : '#ef4444';
            return `
            <div class="dash-skill-row">
                <span class="dash-skill-name">${s.name}</span>
                <div class="dash-skill-bar-track">
                    <div class="dash-skill-bar-fill" style="width:${s.score}%;background:${color}"></div>
                </div>
                <span class="dash-skill-score" style="color:${color}">${s.score}%</span>
            </div>`;
        }).join('');
        return `<div class="dash-skill-radar">${rows}</div>`;
    }

    // ---- Render Missions Summary ----
    function renderMissionsSummary() {
        if (typeof Missions === 'undefined') return '<p class="dash-empty">Missions module not loaded</p>';
        const progress = Missions.getProgress();
        const items = progress.missions.map(m => `
            <div class="dash-mission-item ${m.completed ? 'completed' : ''}">
                <span class="dash-mission-check">${m.completed ? '✅' : '⬜'}</span>
                <span class="dash-mission-icon">${m.icon}</span>
                <span class="dash-mission-text">${m.task}</span>
                <span class="dash-mission-xp ${m.completed ? 'done' : ''}">+${m.xp} XP</span>
            </div>`).join('');
        return `
            <div class="dash-missions-header">
                <span>${progress.completed}/${progress.total} completed</span>
                <div class="dash-missions-progress-track">
                    <div class="dash-missions-progress-fill" style="width:${progress.percent}%"></div>
                </div>
            </div>
            ${items}`;
    }

    // ---- Render Feature Usage ----
    function renderFeatureUsage(features) {
        const maxMsgs = Math.max(...features.map(f => f.messages), 1);
        return features.map(f => {
            const pct = Math.max((f.messages / maxMsgs) * 100, 2);
            return `
            <div class="dash-feature-row" onclick="Router.go('${f.id}')">
                <span class="dash-feature-icon">${f.icon}</span>
                <span class="dash-feature-name">${f.name}</span>
                <div class="dash-feature-bar-track">
                    <div class="dash-feature-bar-fill" style="width:${pct}%;background:${f.color}"></div>
                </div>
                <span class="dash-feature-count">${f.messages}</span>
            </div>`;
        }).join('');
    }

    // ---- Render Career Profile ----
    function renderCareerProfile(profile) {
        const renderTags = (arr, color) =>
            arr.length ? arr.map(t => `<span class="dash-tag" style="border-color:${color}30;color:${color};background:${color}10">${t}</span>`).join('') : '<span class="dash-empty-inline">Not set yet</span>';

        return `
            <div class="dash-profile-grid">
                <div class="dash-profile-section">
                    <div class="dash-profile-label">🎯 Goals</div>
                    <div class="dash-tags">${renderTags(profile.goals, '#f59e0b')}</div>
                </div>
                <div class="dash-profile-section">
                    <div class="dash-profile-label">🏢 Target Companies</div>
                    <div class="dash-tags">${renderTags(profile.targetCompanies, '#4a6cf7')}</div>
                </div>
                <div class="dash-profile-section">
                    <div class="dash-profile-label">💪 Strengths</div>
                    <div class="dash-tags">${renderTags(profile.strengths, '#22c55e')}</div>
                </div>
                <div class="dash-profile-section">
                    <div class="dash-profile-label">📈 Growth Areas</div>
                    <div class="dash-tags">${renderTags(profile.weaknesses, '#ef4444')}</div>
                </div>
                <div class="dash-profile-section">
                    <div class="dash-profile-label">💡 Interests</div>
                    <div class="dash-tags">${renderTags(profile.interests, '#a855f7')}</div>
                </div>
                <div class="dash-profile-section">
                    <div class="dash-profile-label">🔄 Recent Topics</div>
                    <div class="dash-tags">${renderTags(profile.recentTopics.slice(0, 6), '#06b6d4')}</div>
                </div>
            </div>`;
    }

    // ---- Render Streak Heatmap (GitHub-style) ----
    function renderStreakHeatmap(cells) {
        const activeDays = cells.filter(c => c.intensity > 0).length;
        const colors = ['var(--bg-tertiary)', '#0e4429', '#006d32', '#26a641', '#39d353'];
        const cellsHTML = cells.map(c => 
            `<div class="dash-heatmap-cell" style="background:${colors[c.intensity]}" title="${c.date}: ${c.xp} XP"></div>`
        ).join('');
        
        const legend = colors.map((c, i) => 
            `<div class="dash-heatmap-cell dash-heatmap-legend-cell" style="background:${c}"></div>`
        ).join('');

        return `
            <div class="dash-heatmap-wrapper">
                <div class="dash-heatmap-grid">${cellsHTML}</div>
                <div class="dash-heatmap-footer">
                    <span class="dash-heatmap-stat">${activeDays} active days in 12 weeks</span>
                    <div class="dash-heatmap-legend">
                        <span>Less</span>${legend}<span>More</span>
                    </div>
                </div>
            </div>`;
    }

    // ---- Render Satisfaction Metrics ----
    function renderSatisfaction(metrics) {
        const { thumbsUp, thumbsDown, total, satisfactionRate } = metrics;
        const circumference = 2 * Math.PI * 36;
        const offset = circumference - (satisfactionRate / 100) * circumference;
        const rateColor = satisfactionRate >= 80 ? '#22c55e' : satisfactionRate >= 50 ? '#f59e0b' : '#ef4444';

        return `
            <div class="dash-satisfaction">
                <div class="dash-satisfaction-ring">
                    <svg width="90" height="90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg-tertiary)" stroke-width="5"/>
                        <circle cx="40" cy="40" r="36" fill="none" stroke="${rateColor}" stroke-width="5"
                            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                            stroke-linecap="round" transform="rotate(-90 40 40)"
                            style="transition: stroke-dashoffset 1s ease"/>
                    </svg>
                    <div class="dash-satisfaction-value" style="color:${rateColor}">${total > 0 ? satisfactionRate + '%' : '—'}</div>
                </div>
                <div class="dash-satisfaction-details">
                    <div class="dash-satisfaction-row">
                        <span>👍 Helpful</span>
                        <span class="dash-satisfaction-count" style="color:#22c55e">${thumbsUp}</span>
                    </div>
                    <div class="dash-satisfaction-row">
                        <span>👎 Needs work</span>
                        <span class="dash-satisfaction-count" style="color:#ef4444">${thumbsDown}</span>
                    </div>
                    <div class="dash-satisfaction-row">
                        <span>Total rated</span>
                        <span class="dash-satisfaction-count">${total}</span>
                    </div>
                </div>
            </div>`;
    }

    // ---- Render Peak Hours Chart ----
    function renderPeakHours(hours) {
        const maxH = Math.max(...hours, 1);
        // Show condensed: 6 time blocks
        const blocks = [
            { label: 'Night', range: [0, 4], icon: '🌙' },
            { label: 'Early', range: [4, 8], icon: '🌅' },
            { label: 'Morning', range: [8, 12], icon: '☀️' },
            { label: 'Afternoon', range: [12, 16], icon: '🌤️' },
            { label: 'Evening', range: [16, 20], icon: '🌆' },
            { label: 'Late', range: [20, 24], icon: '🌃' },
        ];
        const blockData = blocks.map(b => {
            let total = 0;
            for (let h = b.range[0]; h < b.range[1]; h++) total += hours[h];
            return { ...b, total };
        });
        const maxBlock = Math.max(...blockData.map(b => b.total), 1);
        const peakBlock = blockData.reduce((a, b) => b.total > a.total ? b : a);

        return `
            <div class="dash-peak-hours">
                ${blockData.map(b => {
                    const pct = Math.max((b.total / maxBlock) * 100, 3);
                    const isPeak = b === peakBlock && b.total > 0;
                    return `
                    <div class="dash-peak-col ${isPeak ? 'dash-peak-active' : ''}">
                        <div class="dash-peak-value">${b.total}</div>
                        <div class="dash-peak-bar-track">
                            <div class="dash-peak-bar-fill" style="height:${pct}%"></div>
                        </div>
                        <div class="dash-peak-icon">${b.icon}</div>
                        <div class="dash-peak-label">${b.label}</div>
                    </div>`;
                }).join('')}
            </div>
            ${peakBlock.total > 0 ? `<div class="dash-peak-insight">🕐 You're most active during <strong>${peakBlock.label}</strong> hours</div>` : ''}`;
    }

    // ---- AI Insights (Smart tips based on data) ----
    function generateInsights(stats, profile, trend) {
        const tips = [];
        const todayXP = trend[trend.length - 1]?.xp || 0;
        const yesterdayXP = trend[trend.length - 2]?.xp || 0;
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');

        if (todayXP === 0) tips.push({ icon: '💡', text: 'Start earning XP today! Try a mock interview or chat with Nexus.', type: 'action' });
        if (todayXP > yesterdayXP && yesterdayXP > 0) tips.push({ icon: '📈', text: `Great momentum! You earned ${todayXP - yesterdayXP} more XP than yesterday.`, type: 'positive' });
        if (streak >= 7) tips.push({ icon: '🔥', text: `Incredible ${streak}-day streak! Consistency is your superpower.`, type: 'positive' });
        if (streak === 0) tips.push({ icon: '⏰', text: 'Start a learning streak! Daily practice builds lasting skills.', type: 'action' });
        if (profile.weaknesses.length > 0) tips.push({ icon: '🎯', text: `Focus area: ${profile.weaknesses[0]}. Try the AI Teacher for targeted practice.`, type: 'tip' });
        if (profile.goals.length > 0) tips.push({ icon: '🚀', text: `Working toward: ${profile.goals[0]}. Stay consistent!`, type: 'tip' });
        if (stats.totalChats > 10) tips.push({ icon: '⭐', text: `${stats.totalChats} conversations and counting! You're building real expertise.`, type: 'positive' });
        if (stats.totalChats === 0) tips.push({ icon: '🎤', text: 'Start your first conversation! Ask about career paths or try a mock interview.', type: 'action' });

        return tips.slice(0, 4);
    }

    // ========================
    //  MAIN RENDER
    // ========================
    function render(container) {
        if (!container) return;

        const xp = (typeof Features !== 'undefined') ? Features.getXP() : parseInt(localStorage.getItem('nexus_xp') || '0');
        const level = (typeof Features !== 'undefined') ? Features.getLevel(xp) : { level: 1, name: 'Beginner', icon: '🌱', min: 0, max: 200 };
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const progress = Math.min(((xp - level.min) / (level.max - level.min)) * 100, 100);

        const trend = getXPTrend();
        const skills = getSkillRadar();
        const stats = getSessionStats();
        const features = getFeatureUsage();
        const profile = getCareerProfile();
        const insights = generateInsights(stats, profile, trend);
        const weeklyXP = trend.reduce((s, d) => s + d.xp, 0);
        const heatmap = getStreakHeatmap();
        const satisfaction = getSatisfactionMetrics();
        const peakHours = getPeakHours();

        container.innerHTML = `
        <div class="dash-container">
            <!-- Hero Stats Row -->
            <div class="dash-hero">
                <div class="dash-hero-card dash-hero-xp">
                    <div class="dash-hero-icon">${level.icon}</div>
                    <div class="dash-hero-info">
                        <div class="dash-hero-value">${xp} <span class="dash-hero-unit">XP</span></div>
                        <div class="dash-hero-label">Level ${level.level}: ${level.name}</div>
                    </div>
                    <div class="dash-hero-progress">
                        <div class="dash-hero-progress-fill" style="width:${progress}%"></div>
                    </div>
                    <div class="dash-hero-sublabel">${Math.round(level.max - xp)} XP to next level</div>
                </div>
                <div class="dash-hero-card">
                    <div class="dash-hero-icon">🔥</div>
                    <div class="dash-hero-info">
                        <div class="dash-hero-value">${streak}</div>
                        <div class="dash-hero-label">Day Streak</div>
                    </div>
                </div>
                <div class="dash-hero-card">
                    <div class="dash-hero-icon">💬</div>
                    <div class="dash-hero-info">
                        <div class="dash-hero-value">${stats.totalChats}</div>
                        <div class="dash-hero-label">Sessions</div>
                    </div>
                </div>
                <div class="dash-hero-card">
                    <div class="dash-hero-icon">⏱️</div>
                    <div class="dash-hero-info">
                        <div class="dash-hero-value">${stats.estMinutes}<span class="dash-hero-unit">m</span></div>
                        <div class="dash-hero-label">Study Time</div>
                    </div>
                </div>
            </div>

            <!-- Two-column grid -->
            <div class="dash-grid">
                <!-- Streak Heatmap (full width) -->
                <div class="dash-card dash-card-full">
                    <div class="dash-card-header">
                        <h3>📅 Activity Heatmap</h3>
                        <span class="dash-card-badge">${heatmap.filter(c => c.intensity > 0).length} active days</span>
                    </div>
                    ${renderStreakHeatmap(heatmap)}
                </div>

                <!-- XP Trend Chart -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>📊 XP Trend</h3>
                        <span class="dash-card-badge">${weeklyXP > 0 ? '+' + weeklyXP + ' this week' : 'No activity'}</span>
                    </div>
                    ${renderXPChart(trend)}
                </div>

                <!-- Peak Hours -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>🕐 Peak Hours</h3>
                        <span class="dash-card-badge">When you're most active</span>
                    </div>
                    ${renderPeakHours(peakHours)}
                </div>

                <!-- Daily Missions -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>🎯 Daily Missions</h3>
                        <span class="dash-card-badge">Resets at midnight</span>
                    </div>
                    ${renderMissionsSummary()}
                </div>

                <!-- AI Satisfaction -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>😊 AI Satisfaction</h3>
                        <span class="dash-card-badge">${satisfaction.total} responses rated</span>
                    </div>
                    ${renderSatisfaction(satisfaction)}
                </div>

                <!-- Skill Radar -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>🧠 Skill Radar</h3>
                        <span class="dash-card-badge">Based on your profile</span>
                    </div>
                    ${renderSkillRadar(skills)}
                </div>

                <!-- Feature Usage -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>📈 Feature Usage</h3>
                        <span class="dash-card-badge">${stats.totalMsgs} total messages</span>
                    </div>
                    ${renderFeatureUsage(features)}
                </div>

                <!-- Career Profile (full width) -->
                <div class="dash-card dash-card-full">
                    <div class="dash-card-header">
                        <h3>🧬 Career Profile</h3>
                        <span class="dash-card-badge">${profile.interactionCount} interactions learned</span>
                    </div>
                    ${renderCareerProfile(profile)}
                </div>

                <!-- AI Insights -->
                <div class="dash-card dash-card-full">
                    <div class="dash-card-header">
                        <h3>🤖 AI Insights</h3>
                        <span class="dash-card-badge">Personalized for you</span>
                    </div>
                    <div class="dash-insights">
                        ${insights.length ? insights.map(tip => `
                            <div class="dash-insight-item dash-insight-${tip.type}">
                                <span class="dash-insight-icon">${tip.icon}</span>
                                <span class="dash-insight-text">${tip.text}</span>
                            </div>`).join('') : '<p class="dash-empty">Use more features to unlock personalized insights!</p>'}
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="dash-quick-actions">
                <button class="dash-action-btn" onclick="Router.go('chat')">💬 AI Chat</button>
                <button class="dash-action-btn" onclick="Router.go('mockInterview')">🎤 Mock Interview</button>
                <button class="dash-action-btn" onclick="Router.go('codingArena')">💻 Coding Arena</button>
                <button class="dash-action-btn" onclick="Router.go('aiTeacher')">👨‍🏫 AI Teacher</button>
                <button class="dash-action-btn" onclick="Router.go('careerPath')">🎯 Career Path</button>
                <button class="dash-action-btn" onclick="Router.go('resumeBuilder')">📄 Resume Builder</button>
                <button class="dash-action-btn" onclick="Router.go('gamification')">🏆 XP & Levels</button>
            </div>
        </div>`;

        // Animate bars on mount
        requestAnimationFrame(() => {
            container.querySelectorAll('.dash-bar-fill').forEach(bar => {
                bar.style.transition = 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
            container.querySelectorAll('.dash-skill-bar-fill').forEach(bar => {
                bar.style.transition = 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            });
        });

        // Log visit for heatmap
        try {
            const visitLog = JSON.parse(localStorage.getItem('nexus_visit_log') || '[]');
            const today = new Date().toDateString();
            if (!visitLog.some(v => { try { return new Date(v).toDateString() === today; } catch { return false; } })) {
                visitLog.push(new Date().toISOString());
                // Keep last 90 days
                while (visitLog.length > 90) visitLog.shift();
                localStorage.setItem('nexus_visit_log', JSON.stringify(visitLog));
            }
        } catch {}
    }

    return { render, getSatisfactionMetrics, getPeakHours, getStreakHeatmap };
})();
