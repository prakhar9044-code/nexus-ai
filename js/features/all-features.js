/* NEXUS v2.0 — All Feature Modules */

/* ============ FEATURE INIT REGISTRY ============ */
const Features = (() => {
    const initialized = {};

    function initFeature(id) {
        if (initialized[id]) return;
        initialized[id] = true;
        const initFn = featureInits[id];
        if (initFn) initFn();
    }

    const featureInits = {
        chat: () => { /* Already handled by Chat module */ },

        careerPath: () => {
            const el = document.getElementById('panel-careerPath');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🎯 Smart Career Path Generator**\n\nTell me about yourself and I'll create a personalized roadmap!\n\nPlease share:\n- Your **current skills**\n- Your **interests**\n- Your **target role** (e.g., Full Stack Developer, ML Engineer)\n- Your **timeline** (e.g., 6 months, 1 year)\n\n*Example: "I know HTML, CSS, basic Python. Interested in AI. Want to become an ML Engineer in 18 months."*`));
            FeatureChat.setupInput(input, btn, 'careerPath', msgs);
        },

        skillAnalyzer: () => {
            const el = document.getElementById('panel-skillAnalyzer');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**📊 Skill Gap Analyzer**\n\nI'll compare your skills against real job requirements!\n\nTell me:\n1. **Your current skills** (list them)\n2. **Target role** (SDE, ML Engineer, Data Scientist, etc.)\n\nI'll show you:\n- ✅ Skills you have\n- ❌ Missing skills (priority ordered)\n- 📊 Readiness percentage\n- ⏱ Time to learn each missing skill`));
            FeatureChat.setupInput(input, btn, 'skillAnalyzer', msgs);
        },

        resumeBuilder: () => {
            const el = document.getElementById('panel-resumeBuilder');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧠 AI Resume + Portfolio Builder**\n\nI'll help you create an ATS-optimized resume!\n\nShare your details:\n- **Name & Contact**\n- **Education**\n- **Skills & Technologies**\n- **Experience / Internships**\n- **Projects**\n- **Target role**\n\nI'll generate a professional resume, suggest GitHub projects, and score it for ATS compatibility! 📄`));
            FeatureChat.setupInput(input, btn, 'resumeBuilder', msgs);
        },

        mockInterview: () => {
            const el = document.getElementById('panel-mockInterview');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            // Mode selection
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🎤 Mock Interview Simulator**\n\nReady to practice? Choose your interview mode:\n\n1. **HR Round** — Behavioral & situational questions\n2. **Technical Round** — DSA, coding, problem-solving\n3. **System Design** — Architecture & scalability\n\nJust type the mode (e.g., "Technical Round for SDE role") and I'll start asking questions! 🎯\n\n*Tip: Use the 🎤 mic button for a realistic voice interview experience!*`));
            FeatureChat.setupInput(input, btn, 'mockInterview', msgs);
        },

        roadmap: () => {
            const el = document.getElementById('panel-roadmap');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**📅 Roadmap & Timeline Generator**\n\nI'll convert your goals into actionable timelines!\n\nTell me your goal, e.g.:\n- *"Learn React in 3 months"*\n- *"Prepare for FAANG interview in 6 months"*\n- *"Build a full-stack portfolio in 2 months"*\n\nI'll create a week-by-week plan with daily tasks! 📋`));
            FeatureChat.setupInput(input, btn, 'roadmap', msgs);
        },

        mentor: () => {
            const el = document.getElementById('panel-mentor');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🤖 AI Career Mentor Mode**\n\nChoose your mentor persona:\n\n🧑‍💼 **Sundar Pichai** — Leadership & Strategy\n🚀 **Elon Musk** — Innovation & Risk-taking\n💡 **APJ Abdul Kalam** — Education & Values\n🎯 **Satya Nadella** — Growth Mindset\n\nType the mentor name + your question, e.g.:\n*"Sundar Pichai, how should I prepare for a leadership role?"*\n\nThey'll respond in their unique style! ✨`));
            FeatureChat.setupInput(input, btn, 'mentor', msgs, () => {
                return 'Adopt the persona of the mentor the user has chosen.';
            });
        },

        jobMarket: () => {
            const el = document.getElementById('panel-jobMarket');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**📈 Job Market Analyzer**\n\nI'll analyze the job market for any role or skill!\n\nAsk me things like:\n- *"What's the market like for React developers?"*\n- *"Salary range for ML Engineers in India"*\n- *"Most in-demand skills for 2025"*\n- *"Should I learn Rust or Go?"*\n\nI'll give you data-driven insights with trends, salaries, and recommendations! 💼`));
            FeatureChat.setupInput(input, btn, 'jobMarket', msgs);
        },

        projectIdeas: () => {
            const el = document.getElementById('panel-projectIdeas');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧩 Project Idea Generator**\n\nI'll suggest projects tailored to your level!\n\nTell me:\n- Your **skill level** (Beginner / Intermediate / Advanced)\n- Your **tech stack** (Python, React, Node, etc.)\n- Your **goal** (portfolio, learning, hackathon)\n\nEach project comes with:\n- 📌 Title & Description\n- 🛠 Tech Stack\n- ⏱ Time Estimate\n- ⭐ Resume Impact Score\n\n*Example: "Intermediate Python developer, want ML projects for my resume"*`));
            FeatureChat.setupInput(input, btn, 'projectIdeas', msgs);
        },

        learningPath: () => {
            const el = document.getElementById('panel-learningPath');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧠 Learning Path Optimizer**\n\nI'll create an adaptive learning plan just for you!\n\nTell me:\n- **What** you want to learn\n- **Your current level**\n- **How much time** you can dedicate daily\n- **Any weak areas** you know of\n\nI'll optimize your path with spaced repetition and smart resource suggestions! 📚`));
            FeatureChat.setupInput(input, btn, 'learningPath', msgs);
        },

        codingArena: () => {
            const el = document.getElementById('panel-codingArena');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧪 Coding Practice Arena**\n\nReady to sharpen your coding skills?\n\nChoose your challenge:\n- **Easy** / **Medium** / **Hard**\n- **Topic**: Arrays, Strings, Trees, DP, Graphs, Sorting\n\nOr just say:\n- *"Give me a medium array problem"*\n- *"I want to practice dynamic programming"*\n- *"Give me a random hard problem"*\n\nAfter solving, paste your code and I'll evaluate it! 💻`));
            FeatureChat.setupInput(input, btn, 'codingArena', msgs);
        },

        recruiterSim: () => {
            const el = document.getElementById('panel-recruiterSim');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧑‍💼 Recruiter Simulation Engine**\n\nI'll review your profile as a real recruiter would!\n\nPaste your resume or describe your profile:\n- Skills, experience, education, projects\n- Target company & role\n\nI'll give you:\n- ✅ **HIRE** / 🤔 **MAYBE** / ❌ **REJECT** verdict\n- Detailed reasoning\n- What top candidates have that you don't\n- Specific improvements to make\n\n*No sugar-coating — just honest recruiter perspective!* 🎯`));
            FeatureChat.setupInput(input, btn, 'recruiterSim', msgs);
        },

        dashboard: () => {
            const el = document.getElementById('panel-dashboard');
            const body = el.querySelector('.feature-body');
            renderDashboard(body);
        },

        accountability: () => {
            const el = document.getElementById('panel-accountability');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            // Load streak
            const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
            const lastVisit = localStorage.getItem('nexus_last_visit');
            const today = new Date().toDateString();
            let newStreak = streak;
            if (lastVisit === today) {
                newStreak = streak;
            } else if (lastVisit === new Date(Date.now()-86400000).toDateString()) {
                newStreak = streak + 1;
            } else {
                newStreak = 1;
            }
            localStorage.setItem('nexus_streak', newStreak.toString());
            localStorage.setItem('nexus_last_visit', today);

            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🔔 Smart Accountability System**\n\n🔥 **Current Streak: ${newStreak} day${newStreak !== 1 ? 's' : ''}!** ${newStreak >= 7 ? '🏆' : newStreak >= 3 ? '⭐' : '💪'}\n\nI'm your accountability partner! Tell me:\n- **Your daily/weekly goals**\n- **What you accomplished today**\n- **What you're struggling with**\n\nI'll track your progress, give you nudges, and keep you honest!\n\n*Ask me for a "weekly report" anytime!* 📊`));
            FeatureChat.setupInput(input, btn, 'accountability', msgs);
        },

        networking: () => {
            const el = document.getElementById('panel-networking');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🌐 Networking Assistant**\n\nI'll help you build professional connections!\n\nI can generate:\n- 📩 **LinkedIn connection messages**\n- ✉️ **Cold emails** to recruiters\n- 🔄 **Follow-up messages**\n- 🤝 **Networking strategies**\n\nJust tell me:\n- Who you want to connect with (role, company)\n- Your background\n- What you want to achieve\n\n*Example: "Write a LinkedIn message to a Google recruiter. I'm a final year CS student."*`));
            FeatureChat.setupInput(input, btn, 'networking', msgs);
        },

        personality: () => {
            const el = document.getElementById('panel-personality');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧠 Personality & Strength Analyzer**\n\nI'll help you discover your professional strengths!\n\nI'll ask you a series of thoughtful questions, then analyze:\n- 💪 Your **top strengths**\n- 🎯 **Best-fit career roles**\n- 🏢 **Ideal work environment**\n- 👑 **Leadership style**\n\nReady? Just say **"Start"** and I'll begin the assessment! ✨`));
            FeatureChat.setupInput(input, btn, 'personality', msgs);
        },

        realityCheck: () => {
            const el = document.getElementById('panel-realityCheck');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🎯 Reality Check Mode**\n\n⚡ *Brutally honest feedback — no sugar-coating!*\n\nTell me:\n- Your **current profile** (skills, experience, projects)\n- Your **target** (e.g., "I want to join Google as SDE-2")\n\nI'll give you:\n- 🔴 Hard truths about where you stand\n- 📊 Gap analysis with no filler\n- 📅 Realistic timeline to bridge gaps\n- 💪 An honest path forward\n\n*This builds real confidence through truth, not false hope.* 🎯`));
            FeatureChat.setupInput(input, btn, 'realityCheck', msgs);
        },

        aiTeacher: () => {
            const el = document.getElementById('panel-aiTeacher');
            const msgs = el.querySelector('.feature-messages');
            const input = el.querySelector('.feature-input');
            const btn = el.querySelector('.fbtn-send');
            FeatureChat.addMsg(msgs, 'nexus', FeatureChat.renderMarkdown(`**🧑‍🏫 AI Teacher Mode — Your Personal 24/7 Tutor**\n\nI don't just tell you *what* to learn — I **teach** you!\n\n📚 **What I can teach:**\n- Mathematics (Algebra → Calculus → Linear Algebra)\n- Programming (Python, Java, C++, JS)\n- Data Structures & Algorithms\n- Science (Physics, Chemistry, Biology)\n- Machine Learning & AI concepts\n- System Design\n- Any subject you need!\n\n🎓 **How I teach:**\n- Step-by-step explanations with analogies\n- Practice problems after each concept\n- I adapt to YOUR pace — easier if you're struggling, harder if you're crushing it\n- I explain mistakes gently and re-teach differently\n\n👉 Just tell me: *"Teach me [topic]"* or *"I don't understand [concept]"*\n\n*Example: "Teach me recursion from scratch" or "Explain binary search trees like I'm 10"* 🌟`));
            FeatureChat.setupInput(input, btn, 'aiTeacher', msgs);
        },

        gamification: () => {
            const el = document.getElementById('panel-gamification');
            const body = el.querySelector('.feature-body');
            renderGamification(body);
        }
    };

    // ---- XP & Gamification System ----
    function getXP() { return parseInt(localStorage.getItem('nexus_xp') || '0'); }
    function addXP(amount) {
        const before = getXP();
        const after = before + amount;
        localStorage.setItem('nexus_xp', after.toString());
        const lb = getLevel(before), la = getLevel(after);
        if (la.level > lb.level) {
            Toast.show(`🎉 LEVEL UP! You're now ${la.name}! ${la.icon}`, 'success');
        } else {
            Toast.show(`+${amount} XP earned! ✨`, 'success');
        }
        return after;
    }
    function getLevel(xp) {
        if (xp >= 2000) return { level: 5, name: 'Legend', icon: '👑', min: 2000, max: 9999 };
        if (xp >= 1000) return { level: 4, name: 'Elite', icon: '🏆', min: 1000, max: 2000 };
        if (xp >= 500) return { level: 3, name: 'Pro', icon: '⚡', min: 500, max: 1000 };
        if (xp >= 200) return { level: 2, name: 'Builder', icon: '🔨', min: 200, max: 500 };
        return { level: 1, name: 'Beginner', icon: '🌱', min: 0, max: 200 };
    }

    function renderGamification(container) {
        const xp = getXP();
        const level = getLevel(xp);
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const progress = Math.min(((xp - level.min) / (level.max - level.min)) * 100, 100);

        // XP Log
        const log = JSON.parse(localStorage.getItem('nexus_xp_log') || '[]');

        container.innerHTML = `
            <div class="gamification-hero">
                <div class="xp-level-badge">${level.icon}</div>
                <div class="xp-info">
                    <div class="xp-level-name">Level ${level.level}: ${level.name}</div>
                    <div class="xp-total">${xp} XP</div>
                </div>
            </div>
            <div class="xp-progress-section">
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">
                    <span>${level.name}</span>
                    <span>${xp} / ${level.max} XP</span>
                </div>
                <div class="progress-bar" style="height:12px;">
                    <div class="progress-bar-fill" style="width:${progress}%;background:linear-gradient(90deg,var(--accent),#f59e0b);"></div>
                </div>
            </div>

            <div class="stat-row" style="margin-top:20px;">
                <div class="stat-card"><div class="stat-emoji">🔥</div><div class="stat-value">${streak}</div><div class="stat-label">Day Streak</div></div>
                <div class="stat-card"><div class="stat-emoji">${level.icon}</div><div class="stat-value">${level.level}</div><div class="stat-label">Level</div></div>
                <div class="stat-card"><div class="stat-emoji">⭐</div><div class="stat-value">${xp}</div><div class="stat-label">Total XP</div></div>
            </div>

            <div class="fcard" style="margin-top:16px;">
                <div class="fcard-title">🎯 Earn XP</div>
                <div class="fcard-subtitle">Complete activities to level up!</div>
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
                    <button class="fbtn fbtn-secondary xp-earn-btn" data-xp="20" data-reason="Coding practice">🧪 Solved a coding problem (+20 XP)</button>
                    <button class="fbtn fbtn-secondary xp-earn-btn" data-xp="15" data-reason="Learning session">📚 Completed a learning session (+15 XP)</button>
                    <button class="fbtn fbtn-secondary xp-earn-btn" data-xp="30" data-reason="Job application">📄 Submitted a job application (+30 XP)</button>
                    <button class="fbtn fbtn-secondary xp-earn-btn" data-xp="25" data-reason="Mock interview">🎤 Completed a mock interview (+25 XP)</button>
                    <button class="fbtn fbtn-secondary xp-earn-btn" data-xp="50" data-reason="Challenge completed">🏆 Completed a challenge (+50 XP)</button>
                    <button class="fbtn fbtn-secondary xp-earn-btn" data-xp="10" data-reason="Daily streak bonus">🔥 Daily check-in (+10 XP)</button>
                </div>
            </div>

            <div class="fcard" style="margin-top:16px;">
                <div class="fcard-title">📜 XP History</div>
                <div id="xp-history" style="margin-top:8px;max-height:200px;overflow-y:auto;">
                    ${log.length ? log.slice(-10).reverse().map(e => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.8rem;"><span>${e.reason}</span><span style="color:var(--green);font-weight:600;">+${e.xp} XP</span></div>`).join('') : '<p style="color:var(--text-tertiary);font-size:0.82rem;">No XP earned yet — start learning!</p>'}
                </div>
            </div>

            <div class="fcard" style="margin-top:16px;">
                <div class="fcard-title">🏅 Level Roadmap</div>
                <div style="margin-top:12px;">
                    ${[{l:1,n:'Beginner',i:'🌱',r:'0-200'},{l:2,n:'Builder',i:'🔨',r:'200-500'},{l:3,n:'Pro',i:'⚡',r:'500-1000'},{l:4,n:'Elite',i:'🏆',r:'1000-2000'},{l:5,n:'Legend',i:'👑',r:'2000+'}].map(lv => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;${level.level >= lv.l ? 'opacity:1':'opacity:0.4'}"><span style="font-size:1.3rem">${lv.i}</span><div><strong>Level ${lv.l}: ${lv.n}</strong><div style="font-size:0.72rem;color:var(--text-tertiary)">${lv.r} XP</div></div>${level.level >= lv.l ? '<span style="color:var(--green);font-size:0.75rem;margin-left:auto">✅ Unlocked</span>' : '<span style="color:var(--text-tertiary);font-size:0.75rem;margin-left:auto">🔒 Locked</span>'}</div>`).join('')}
                </div>
            </div>
        `;

        // Wire up XP earn buttons
        container.querySelectorAll('.xp-earn-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.xp);
                const reason = btn.dataset.reason;
                addXP(amount);
                // Log it
                const log = JSON.parse(localStorage.getItem('nexus_xp_log') || '[]');
                log.push({ xp: amount, reason, time: new Date().toLocaleString() });
                localStorage.setItem('nexus_xp_log', JSON.stringify(log));
                // Re-render
                renderGamification(container);
            });
        });
    }

    // ---- Dashboard Rendering ----
    function renderDashboard(container) {
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const chatCount = Object.keys(chats).length;
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const totalMsgs = Object.values(chats).reduce((s, c) => s + (c.messages?.length || 0), 0);
        const xp = getXP();
        const level = getLevel(xp);

        container.innerHTML = `
            <div class="stat-row">
                <div class="stat-card"><div class="stat-emoji">💬</div><div class="stat-value" id="dash-chats">${chatCount}</div><div class="stat-label">Conversations</div></div>
                <div class="stat-card"><div class="stat-emoji">📝</div><div class="stat-value" id="dash-msgs">${totalMsgs}</div><div class="stat-label">Messages</div></div>
                <div class="stat-card"><div class="stat-emoji">🔥</div><div class="stat-value">${streak}</div><div class="stat-label">Day Streak</div></div>
                <div class="stat-card"><div class="stat-emoji">${level.icon}</div><div class="stat-value">${xp} XP</div><div class="stat-label">${level.name}</div></div>
            </div>
            <div class="fcard">
                <div class="fcard-title">📈 Your Activity</div>
                <div class="fcard-subtitle">Features you've explored</div>
                <div id="dash-activity" style="margin-top:12px;"></div>
            </div>
            <div class="fcard" style="margin-top:16px;">
                <div class="fcard-title">💡 Quick Actions</div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
                    <button class="fbtn fbtn-secondary" onclick="Router.go('careerPath')">🎯 Career Path</button>
                    <button class="fbtn fbtn-secondary" onclick="Router.go('mockInterview')">🎤 Mock Interview</button>
                    <button class="fbtn fbtn-secondary" onclick="Router.go('codingArena')">🧪 Coding Practice</button>
                    <button class="fbtn fbtn-secondary" onclick="Router.go('aiTeacher')">🧑‍🏫 AI Teacher</button>
                    <button class="fbtn fbtn-secondary" onclick="Router.go('gamification')">🎮 XP & Levels</button>
                    <button class="fbtn fbtn-secondary" onclick="Router.go('realityCheck')">⚡ Reality Check</button>
                    <button class="fbtn fbtn-secondary" onclick="Router.go('resumeBuilder')">📄 Build Resume</button>
                </div>
            </div>
        `;

        const actEl = document.getElementById('dash-activity');
        if (actEl) {
            const featureNames = {chat:'Chat',careerPath:'Career Path',skillAnalyzer:'Skill Analyzer',resumeBuilder:'Resume Builder',mockInterview:'Mock Interview',aiTeacher:'AI Teacher',codingArena:'Coding Arena',realityCheck:'Reality Check'};
            let html = '';
            Object.entries(featureNames).forEach(([id, name]) => {
                const conv = Nexus.getConversation(id);
                const pct = Math.min((conv.length / 20) * 100, 100);
                html += `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary);margin-bottom:3px;"><span>${name}</span><span>${conv.length} msgs</span></div><div class="progress-bar"><div class="progress-bar-fill" style="width:${pct}%"></div></div></div>`;
            });
            actEl.innerHTML = html || '<p style="color:var(--text-tertiary);font-size:0.82rem;">Start using features to see your activity!</p>';
        }
    }

    return { initFeature, addXP, getXP, getLevel };
})();

