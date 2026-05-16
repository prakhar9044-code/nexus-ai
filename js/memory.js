/* NEXUS v4.0 — AI Memory Engine
   Stores user context, goals, strengths, weaknesses in Firestore.
   Injects personalized context into every AI prompt.
   Extracts learnable facts from conversations.
*/
const Memory = (() => {
    let profile = null;       // cached user memory profile
    let loaded = false;
    let extractionQueue = []; // queue of messages to extract from

    // ---- Default memory shape ----
    const DEFAULT_PROFILE = {
        goals: [],              // e.g. ["SDE at Google", "Learn System Design"]
        career_path: '',        // e.g. "full-stack"
        target_companies: [],   // e.g. ["Google","Microsoft"]
        strengths: [],          // e.g. ["JavaScript","React"]
        weaknesses: [],         // e.g. ["DP","System Design"]
        interests: [],          // e.g. ["AI/ML","Web Dev"]
        college_year: '',       // e.g. "3rd Year"
        learning_style: '',     // visual / textual / interactive
        recent_topics: [],      // last 10 topics discussed
        facts: [],              // extracted facts about user (max 20)
        interaction_count: 0,
        first_seen: null,
        last_updated: null
    };

    // ---- Load from Firestore ----
    async function load() {
        if (loaded && profile) return profile;
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) return null;
            const doc = await db.collection('users').doc(uid).collection('ai_memory').doc('profile').get();
            if (doc.exists) {
                profile = { ...DEFAULT_PROFILE, ...doc.data() };
            } else {
                profile = { ...DEFAULT_PROFILE, first_seen: new Date().toISOString() };
                // Bootstrap from existing user profile data
                const userProfile = await DB.loadUserProfile();
                if (userProfile) {
                    if (userProfile.interests?.length) profile.interests = userProfile.interests;
                    if (userProfile.level) profile.college_year = userProfile.level;
                    if (userProfile.displayName) profile.display_name = userProfile.displayName;
                }
                await save();
            }
            loaded = true;
            return profile;
        } catch (e) {
            console.warn('Memory load failed:', e);
            profile = { ...DEFAULT_PROFILE };
            loaded = true;
            return profile;
        }
    }

    // ---- Save to Firestore ----
    async function save() {
        try {
            const uid = auth.currentUser?.uid;
            if (!uid || !profile) return;
            profile.last_updated = new Date().toISOString();
            await db.collection('users').doc(uid).collection('ai_memory').doc('profile').set(profile, { merge: true });
        } catch (e) {
            console.warn('Memory save failed:', e);
        }
    }

    // ---- Update specific fields ----
    async function update(fields) {
        if (!profile) await load();
        Object.assign(profile, fields);
        await save();
    }

    // ---- Add items to arrays (deduped, capped) ----
    async function addToList(key, items, maxLen = 10) {
        if (!profile) await load();
        if (!Array.isArray(profile[key])) profile[key] = [];
        items.forEach(item => {
            const lower = item.toLowerCase().trim();
            if (!profile[key].some(x => x.toLowerCase().trim() === lower)) {
                profile[key].push(item.trim());
            }
        });
        if (profile[key].length > maxLen) {
            profile[key] = profile[key].slice(-maxLen);
        }
        await save();
    }

    // ---- Track topic ----
    async function trackTopic(topic) {
        if (!topic || !profile) return;
        await addToList('recent_topics', [topic], 15);
    }

    // ---- Extract memory from AI conversation ----
    async function extractFromConversation(userMsg, aiResponse) {
        if (!profile) await load();
        profile.interaction_count = (profile.interaction_count || 0) + 1;

        // Simple keyword-based extraction (fast, no extra API call)
        const msg = userMsg.toLowerCase();

        // Goal detection
        const goalPatterns = [/i want to (?:become|be|work as|get into|join) (.+)/i, /my goal is (.+)/i, /i'm (?:preparing|aiming) for (.+)/i, /dream (?:job|role|company) (?:is|at) (.+)/i];
        for (const p of goalPatterns) {
            const m = userMsg.match(p);
            if (m) await addToList('goals', [m[1].replace(/[.!?]+$/, '')], 5);
        }

        // Company detection
        const companies = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix', 'flipkart', 'uber', 'stripe', 'adobe', 'oracle', 'infosys', 'tcs', 'wipro', 'deloitte'];
        const foundCompanies = companies.filter(c => msg.includes(c));
        if (foundCompanies.length) await addToList('target_companies', foundCompanies.map(c => c.charAt(0).toUpperCase() + c.slice(1)), 8);

        // Topic extraction (simple)
        const topics = ['dsa', 'dynamic programming', 'dp', 'arrays', 'linked list', 'trees', 'graphs', 'system design', 'react', 'javascript', 'python', 'java', 'c++', 'machine learning', 'ai', 'sql', 'databases', 'api', 'node.js', 'html', 'css', 'resume', 'interview', 'behavioral'];
        const foundTopics = topics.filter(t => msg.includes(t));
        if (foundTopics.length) await addToList('recent_topics', foundTopics, 15);

        // Career path detection
        if (!profile.career_path) {
            const paths = { 'frontend': 'Frontend Developer', 'backend': 'Backend Developer', 'full stack': 'Full-Stack Developer', 'full-stack': 'Full-Stack Developer', 'data scien': 'Data Scientist', 'machine learn': 'ML Engineer', 'devops': 'DevOps Engineer', 'android': 'Android Developer', 'ios': 'iOS Developer', 'product manag': 'Product Manager' };
            for (const [k, v] of Object.entries(paths)) {
                if (msg.includes(k)) { profile.career_path = v; break; }
            }
        }

        // Year detection
        if (!profile.college_year) {
            const yearMatch = userMsg.match(/(\d+)(?:st|nd|rd|th)\s+year/i);
            if (yearMatch) profile.college_year = yearMatch[0];
        }

        // Skill/strength detection (from user boasting or listing skills)
        const skillPatterns = [/i (?:know|am good at|have experience in|am skilled in|can do) (.+)/i, /my skills (?:are|include) (.+)/i];
        for (const p of skillPatterns) {
            const m = userMsg.match(p);
            if (m) {
                const skills = m[1].split(/[,&]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 30);
                if (skills.length) await addToList('strengths', skills, 10);
            }
        }

        // Weakness detection
        const weakPatterns = [/i(?:'m| am) (?:weak|bad|struggling|not good) (?:at|in|with) (.+)/i, /i (?:don't|cant|cannot) understand (.+)/i, /(?:help me|teach me|explain) (.+)/i];
        for (const p of weakPatterns) {
            const m = userMsg.match(p);
            if (m) {
                const weak = m[1].replace(/[.!?]+$/, '').trim();
                if (weak.length > 2 && weak.length < 40) await addToList('weaknesses', [weak], 10);
            }
        }

        // Save every 5 interactions
        if (profile.interaction_count % 5 === 0) await save();
    }

    // ---- Build context string for system prompt injection ----
    function buildContext() {
        if (!profile) return '';
        const parts = [];
        const name = profile.display_name || localStorage.getItem('nexus_student_name') || '';
        if (name) parts.push(`User's name: ${name}`);
        if (profile.college_year) parts.push(`Education level: ${profile.college_year}`);
        if (profile.career_path) parts.push(`Career path: ${profile.career_path}`);
        if (profile.goals.length) parts.push(`Goals: ${profile.goals.join(', ')}`);
        if (profile.target_companies.length) parts.push(`Target companies: ${profile.target_companies.join(', ')}`);
        if (profile.strengths.length) parts.push(`Strengths: ${profile.strengths.join(', ')}`);
        if (profile.weaknesses.length) parts.push(`Weak areas (focus here): ${profile.weaknesses.join(', ')}`);
        if (profile.interests.length) parts.push(`Interests: ${profile.interests.join(', ')}`);
        if (profile.recent_topics.length) parts.push(`Recent topics: ${profile.recent_topics.slice(-5).join(', ')}`);
        if (profile.interaction_count) parts.push(`Interaction count: ${profile.interaction_count} (${profile.interaction_count > 50 ? 'power user' : profile.interaction_count > 10 ? 'regular' : 'new user'})`);

        // Add streak and XP from localStorage
        const xp = localStorage.getItem('nexus_total_xp') || '0';
        const streak = localStorage.getItem('nexus_streak_count') || '0';
        if (parseInt(xp) > 0) parts.push(`XP: ${xp}`);
        if (parseInt(streak) > 1) parts.push(`Current streak: ${streak} days`);

        if (!parts.length) return '';
        return '\n\n[USER MEMORY — Use this to personalize responses. Reference their goals, progress, and context naturally. Be specific to THEIR journey.]\n' + parts.join('\n');
    }

    // ---- Generate quick action suggestions based on context ----
    function getSuggestions(lastUserMsg, lastAiResponse, featureId) {
        const suggestions = [];
        const msg = (lastUserMsg || '').toLowerCase();
        const resp = (lastAiResponse || '').toLowerCase();

        // Context-aware suggestions based on feature
        if (featureId === 'chat') {
            if (resp.includes('roadmap') || resp.includes('plan')) {
                suggestions.push('📅 Create a detailed roadmap');
            }
            if (resp.includes('interview') || resp.includes('prepare')) {
                suggestions.push('🎤 Start mock interview');
            }
            if (resp.includes('resume') || resp.includes('cv')) {
                suggestions.push('📄 Build my resume');
            }
            if (resp.includes('practice') || resp.includes('problem') || resp.includes('leetcode')) {
                suggestions.push('💻 Practice coding');
            }
            if (resp.includes('learn') || resp.includes('teach') || resp.includes('explain')) {
                suggestions.push('👨‍🏫 Deep dive with AI Teacher');
            }
            // General suggestions based on user memory
            if (profile?.weaknesses?.length) {
                suggestions.push(`🎯 Work on ${profile.weaknesses[0]}`);
            }
            if (profile?.goals?.length && suggestions.length < 3) {
                suggestions.push(`🚀 Progress toward: ${profile.goals[0].slice(0, 30)}`);
            }
        } else if (featureId === 'mockInterview') {
            suggestions.push('🔄 Another question', '📊 Show my scorecard', '💡 Give me a hint');
        } else if (featureId === 'codingArena') {
            suggestions.push('🎯 Next problem', '💡 Give a hint', '📊 Check my solution');
        } else if (featureId === 'aiTeacher') {
            suggestions.push('📝 Quiz me on this', '🔄 Explain differently', '➡️ Next topic');
        }

        // Default fallbacks
        if (!suggestions.length) {
            suggestions.push('📊 Analyze my skills', '📅 Create a study plan', '🎤 Mock interview');
        }

        return suggestions.slice(0, 3); // Max 3 suggestions
    }

    // ---- Get profile (cached) ----
    function getProfile() { return profile; }

    return { load, save, update, addToList, trackTopic, extractFromConversation, buildContext, getSuggestions, getProfile };
})();
