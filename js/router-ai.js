/* NEXUS v4.0 — Smart Intent Router
   Auto-detects user intent from chat messages and routes to the optimal agent prompt.
   No extra API call — uses fast keyword/pattern matching.
*/
const IntentRouter = (() => {
    // Intent → featureId mapping with keyword patterns
    const INTENTS = [
        {
            id: 'mockInterview',
            keywords: ['mock interview', 'interview question', 'practice interview', 'hr round', 'technical round', 'interview prep', 'behavioral question', 'star method'],
            patterns: [/interview me/i, /ask me.*interview/i, /conduct.*interview/i, /simulate.*interview/i]
        },
        {
            id: 'resumeBuilder',
            keywords: ['resume', 'cv', 'ats', 'cover letter'],
            patterns: [/review my resume/i, /build.*resume/i, /improve.*resume/i, /ats.*score/i, /resume.*score/i]
        },
        {
            id: 'codingArena',
            keywords: ['leetcode', 'coding problem', 'dsa problem', 'coding challenge'],
            patterns: [/give me.*problem/i, /solve.*problem/i, /coding.*practice/i, /dsa.*question/i, /data structure.*question/i]
        },
        {
            id: 'careerPath',
            keywords: ['career path', 'career roadmap', 'career guidance', 'career switch', 'career change'],
            patterns: [/what.*career/i, /best.*career.*for/i, /how.*become.*(?:developer|engineer|designer|manager)/i, /career.*advice/i]
        },
        {
            id: 'skillAnalyzer',
            keywords: ['skill gap', 'skill analysis', 'skill assessment', 'missing skills'],
            patterns: [/analyze.*skills/i, /what skills.*need/i, /skill.*gap/i, /am i ready/i, /readiness.*score/i]
        },
        {
            id: 'roadmap',
            keywords: ['roadmap', 'study plan', 'learning plan', 'weekly plan', 'study schedule'],
            patterns: [/create.*roadmap/i, /make.*plan/i, /learning.*path/i, /study.*schedule/i, /week.*plan/i]
        },
        {
            id: 'aiTeacher',
            keywords: ['teach me', 'explain', 'how does', 'what is', 'concept of'],
            patterns: [/teach me/i, /explain.*concept/i, /help me understand/i, /break.*down/i, /eli5/i, /feynman/i],
            minScore: 2 // needs stronger match since "explain" is too common
        },
        {
            id: 'recruiterSim',
            keywords: ['recruiter', 'hiring manager', 'would i get hired', 'profile review'],
            patterns: [/review.*profile/i, /hire me/i, /recruiter.*sim/i, /would.*company.*hire/i]
        },
        {
            id: 'projectIdeas',
            keywords: ['project idea', 'side project', 'portfolio project', 'build something'],
            patterns: [/suggest.*project/i, /project.*idea/i, /what.*build/i, /portfolio.*project/i]
        },
        {
            id: 'realityCheck',
            keywords: ['reality check', 'brutal honest', 'am i good enough', 'honest feedback'],
            patterns: [/be honest/i, /reality.*check/i, /brutal.*feedback/i, /am i.*ready/i, /truth about/i]
        },
        {
            id: 'jobMarket',
            keywords: ['job market', 'salary', 'hiring trend', 'job opening', 'demand for'],
            patterns: [/job.*market/i, /salary.*for/i, /hiring.*trend/i, /is.*in demand/i, /companies.*hiring/i]
        }
    ];

    // Score a message against an intent
    function scoreIntent(msg, intent) {
        const lower = msg.toLowerCase();
        let score = 0;
        // Keyword matches
        for (const kw of intent.keywords) {
            if (lower.includes(kw)) score += 2;
        }
        // Pattern matches
        for (const p of intent.patterns) {
            if (p.test(msg)) score += 3;
        }
        return score;
    }

    // Route a message to the best agent
    function route(userMessage) {
        let best = { id: 'chat', score: 0 };
        for (const intent of INTENTS) {
            const score = scoreIntent(userMessage, intent);
            const minScore = intent.minScore || 2;
            if (score > best.score && score >= minScore) {
                best = { id: intent.id, score };
            }
        }
        return best;
    }

    // Get a label for display
    function getAgentLabel(intentId) {
        const labels = {
            chat: '💬 General Chat',
            mockInterview: '🎤 Interview Coach',
            resumeBuilder: '📄 Resume Expert',
            codingArena: '💻 Coding Mentor',
            careerPath: '🎯 Career Strategist',
            skillAnalyzer: '📊 Skill Evaluator',
            roadmap: '📅 Roadmap Planner',
            aiTeacher: '👨‍🏫 AI Teacher',
            recruiterSim: '🔍 Recruiter Sim',
            projectIdeas: '🛠 Project Advisor',
            realityCheck: '💀 Reality Check',
            jobMarket: '📈 Market Analyst'
        };
        return labels[intentId] || labels.chat;
    }

    return { route, getAgentLabel, INTENTS };
})();
