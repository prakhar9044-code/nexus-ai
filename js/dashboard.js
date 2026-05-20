/* NEXUS v5.0 — Career Dashboard Engine
   Phase 5: Full analytics dashboard with XP trends, skill radar,
   mission progress, session history, career profile, and AI insights.
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
        // Boost scores for strengths, reduce for weaknesses
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
        // Estimate time (avg 30 seconds per message)
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

    // ---- Render Skill Radar (Pure CSS hexagon-style) ----
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
                <!-- XP Trend Chart -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>📊 XP Trend</h3>
                        <span class="dash-card-badge">${weeklyXP > 0 ? '+' + weeklyXP + ' this week' : 'No activity'}</span>
                    </div>
                    ${renderXPChart(trend)}
                </div>

                <!-- Daily Missions -->
                <div class="dash-card">
                    <div class="dash-card-header">
                        <h3>🎯 Daily Missions</h3>
                        <span class="dash-card-badge">Resets at midnight</span>
                    </div>
                    ${renderMissionsSummary()}
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
    }

    return { render };
})();
