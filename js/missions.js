/* NEXUS v4.0 — Daily Missions Engine
   Generates personalized daily tasks based on user memory.
   Tracks completion, awards XP, drives retention.
*/
const Missions = (() => {
    const STORAGE_KEY = 'nexus_daily_missions';
    const DATE_KEY = 'nexus_missions_date';
    let missions = [];

    // Mission templates — personalized at generation time
    const TEMPLATES = [
        { id: 'chat',      icon: '💬', task: 'Have a 5-minute AI conversation',     xp: 10,  type: 'chat' },
        { id: 'quiz',      icon: '📝', task: 'Complete a quiz on any topic',         xp: 20,  type: 'quiz' },
        { id: 'coding',    icon: '💻', task: 'Solve 1 coding problem',              xp: 25,  type: 'coding' },
        { id: 'interview', icon: '🎤', task: 'Practice 1 mock interview question',  xp: 20,  type: 'interview' },
        { id: 'roadmap',   icon: '📅', task: 'Review your learning roadmap',        xp: 10,  type: 'roadmap' },
        { id: 'resume',    icon: '📄', task: 'Improve one section of your resume',  xp: 15,  type: 'resume' },
        { id: 'learn',     icon: '🎓', task: 'Learn a new concept with AI Teacher', xp: 20,  type: 'learn' },
        { id: 'skill',     icon: '📊', task: 'Run a skill gap analysis',            xp: 15,  type: 'skill' },
    ];

    // Generate daily missions (3 missions per day)
    function generate() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem(DATE_KEY);

        // Return cached if same day
        if (stored === today) {
            missions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (missions.length) return missions;
        }

        // Generate new missions
        const pool = [...TEMPLATES];
        // Personalize: if user has weaknesses, prioritize related missions
        const profile = (typeof Memory !== 'undefined') ? Memory.getProfile() : null;
        if (profile?.weaknesses?.length) {
            const weak = profile.weaknesses[0].toLowerCase();
            // Add a personalized mission
            pool.push({
                id: 'weakness',
                icon: '🎯',
                task: `Practice ${profile.weaknesses[0]}`,
                xp: 30,
                type: 'weakness'
            });
        }
        if (profile?.goals?.length) {
            pool.push({
                id: 'goal',
                icon: '🚀',
                task: `Work toward: ${profile.goals[0].slice(0, 35)}`,
                xp: 25,
                type: 'goal'
            });
        }

        // Shuffle and pick 3
        const shuffled = pool.sort(() => Math.random() - 0.5);
        missions = shuffled.slice(0, 3).map((m, i) => ({
            ...m,
            completed: false,
            order: i
        }));

        // Add bonus mission
        missions.push({
            id: 'bonus',
            icon: '⭐',
            task: 'Complete all 3 missions above',
            xp: 50,
            type: 'bonus',
            completed: false,
            order: 3,
            isBonus: true
        });

        save(today);
        return missions;
    }

    // Mark a mission as complete
    function complete(missionId) {
        const mission = missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return null;
        mission.completed = true;

        // Check if bonus is earned
        const bonus = missions.find(m => m.isBonus);
        const regularComplete = missions.filter(m => !m.isBonus && m.completed).length;
        const regularTotal = missions.filter(m => !m.isBonus).length;
        if (bonus && !bonus.completed && regularComplete >= regularTotal) {
            bonus.completed = true;
        }

        save(new Date().toDateString());
        return mission;
    }

    // Auto-detect mission completion from user actions
    function checkAutoComplete(action) {
        const mapping = {
            'chat_message': 'chat',
            'quiz_complete': 'quiz',
            'problem_solved': 'coding',
            'interview_done': 'interview',
            'roadmap_viewed': 'roadmap',
            'resume_updated': 'resume',
            'concept_learned': 'learn',
            'skill_analyzed': 'skill'
        };
        const missionType = mapping[action];
        if (!missionType) return null;
        const mission = missions.find(m => m.type === missionType && !m.completed);
        if (mission) return complete(mission.id);
        return null;
    }

    // Get progress
    function getProgress() {
        if (!missions.length) generate();
        const completed = missions.filter(m => m.completed).length;
        const total = missions.length;
        return { completed, total, missions, percent: Math.round((completed / total) * 100) };
    }

    // Save
    function save(date) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
        localStorage.setItem(DATE_KEY, date);
        // Trigger Sync Engine (Phase 6)
        if (typeof Sync !== 'undefined') Sync.onMissionChange();
    }

    // Render missions panel HTML
    function renderHTML() {
        if (!missions.length) generate();
        const progress = getProgress();
        return `
        <div class="missions-container">
            <div class="missions-header">
                <div class="missions-title">
                    <span class="missions-icon">🎯</span>
                    <div>
                        <h3>Daily Missions</h3>
                        <span class="missions-subtitle">${progress.completed}/${progress.total} completed • ${progress.percent}%</span>
                    </div>
                </div>
                <div class="missions-progress-bar">
                    <div class="missions-progress-fill" style="width:${progress.percent}%"></div>
                </div>
            </div>
            <div class="missions-list">
                ${missions.map(m => `
                    <div class="mission-item ${m.completed ? 'completed' : ''} ${m.isBonus ? 'bonus' : ''}" data-mission-id="${m.id}">
                        <div class="mission-check">${m.completed ? '✅' : '⬜'}</div>
                        <span class="mission-emoji">${m.icon}</span>
                        <div class="mission-info">
                            <span class="mission-task">${m.task}</span>
                            <span class="mission-xp">+${m.xp} XP</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="missions-reset-hint">Resets daily at midnight</div>
        </div>`;
    }

    return { generate, complete, checkAutoComplete, getProgress, renderHTML };
})();
