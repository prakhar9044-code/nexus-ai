/* NEXUS v4.0 — Agent State Machine
   Tracks per-agent state across multi-turn conversations.
   Interview: questions asked, scores, topics covered
   Coding:    problems solved, difficulty, topics
   Teacher:   concepts taught, quiz results, difficulty level
   Enables truly intelligent multi-turn agent behavior.
*/
const AgentState = (() => {
    const states = {};

    // ---- State schemas per agent type ----
    const SCHEMAS = {
        mockInterview: () => ({
            mode: '',           // hr | technical | system-design
            questionsAsked: 0,
            maxQuestions: 7,
            scores: [],         // [{question, score, feedback}]
            phase: 'intro',     // intro | questioning | scoring | done
            topics: [],
            startTime: Date.now()
        }),
        codingArena: () => ({
            problemsSolved: 0,
            currentDifficulty: 'medium',
            currentTopic: '',
            streak: 0,          // consecutive correct
            topicsCovered: [],
            totalAttempts: 0,
            phase: 'idle',      // idle | problem | evaluating | hint
            startTime: Date.now()
        }),
        aiTeacher: () => ({
            currentTopic: '',
            conceptsTaught: [],
            quizResults: [],    // [{topic, correct, total}]
            difficultyLevel: 'medium', // easy | medium | hard
            phase: 'idle',      // idle | teaching | quizzing | reviewing
            understanding: 0.5, // 0-1 scale based on quiz performance
            startTime: Date.now()
        }),
        skillAnalyzer: () => ({
            targetRole: '',
            currentSkills: [],
            gaps: [],
            readinessScore: 0,
            phase: 'idle',
            startTime: Date.now()
        }),
        recruiterSim: () => ({
            profileReceived: false,
            verdict: '',        // hire | maybe | reject
            feedback: [],
            improvements: [],
            phase: 'idle',
            startTime: Date.now()
        }),
        personality: () => ({
            questionsAsked: 0,
            maxQuestions: 7,
            answers: [],
            phase: 'intro',    // intro | assessing | results
            startTime: Date.now()
        })
    };

    // ---- Get or create state for an agent ----
    function get(agentId) {
        if (!states[agentId]) {
            const schema = SCHEMAS[agentId];
            states[agentId] = schema ? schema() : { phase: 'idle', startTime: Date.now() };
        }
        return states[agentId];
    }

    // ---- Update state ----
    function update(agentId, updates) {
        const state = get(agentId);
        Object.assign(state, updates);
        return state;
    }

    // ---- Reset agent state ----
    function reset(agentId) {
        const schema = SCHEMAS[agentId];
        states[agentId] = schema ? schema() : { phase: 'idle', startTime: Date.now() };
        return states[agentId];
    }

    // ---- Parse AI response to auto-update state ----
    function parseAndUpdate(agentId, userMsg, aiResponse) {
        const state = get(agentId);
        const resp = aiResponse.toLowerCase();
        const msg = userMsg.toLowerCase();

        if (agentId === 'mockInterview') {
            // Detect question being asked (AI asks a "?")
            const questionMarks = (aiResponse.match(/\?/g) || []).length;
            if (state.phase === 'intro' && questionMarks > 0) {
                state.phase = 'questioning';
                state.questionsAsked = 1;
            } else if (state.phase === 'questioning') {
                state.questionsAsked++;
            }
            // Detect scorecard
            if (resp.includes('scorecard') || resp.includes('overall:') || resp.includes('/10')) {
                const scoreMatch = aiResponse.match(/overall[:\s]*(\d+)\/10/i);
                if (scoreMatch) state.overallScore = parseInt(scoreMatch[1]);
                state.phase = 'done';
                // Auto-complete mission
                if (typeof Missions !== 'undefined') Missions.checkAutoComplete('interview_done');
            }
            // Detect feedback on answer
            const feedbackPatterns = [/good|great|excellent|well done/i, /could improve|needs work|weak/i];
            if (feedbackPatterns[0].test(aiResponse)) state.scores.push({ score: 'good' });
            else if (feedbackPatterns[1].test(aiResponse)) state.scores.push({ score: 'needs-improvement' });
        }

        else if (agentId === 'codingArena') {
            // Detect new problem given
            if (resp.includes('problem') && resp.includes('example') && resp.includes('constraint')) {
                state.phase = 'problem';
                state.totalAttempts++;
                // Detect difficulty
                if (resp.includes('easy')) state.currentDifficulty = 'easy';
                else if (resp.includes('hard')) state.currentDifficulty = 'hard';
                else state.currentDifficulty = 'medium';
            }
            // Detect solution evaluation
            if (resp.includes('correct') || resp.includes('accepted') || resp.includes('well done')) {
                state.problemsSolved++;
                state.streak++;
                state.phase = 'idle';
                // Auto-complete mission
                if (typeof Missions !== 'undefined') Missions.checkAutoComplete('problem_solved');
                // Adaptive difficulty
                if (state.streak >= 3 && state.currentDifficulty !== 'hard') {
                    state.currentDifficulty = state.currentDifficulty === 'easy' ? 'medium' : 'hard';
                }
            }
            if (resp.includes('incorrect') || resp.includes('wrong') || resp.includes('not quite')) {
                state.streak = 0;
                if (state.currentDifficulty !== 'easy') {
                    state.currentDifficulty = state.currentDifficulty === 'hard' ? 'medium' : 'easy';
                }
            }
            // Detect topic
            const topicKeywords = ['array', 'string', 'tree', 'graph', 'dp', 'dynamic programming', 'linked list', 'stack', 'queue', 'hash', 'binary search', 'sorting', 'backtracking', 'greedy'];
            for (const t of topicKeywords) {
                if (resp.includes(t) && !state.topicsCovered.includes(t)) {
                    state.topicsCovered.push(t);
                    state.currentTopic = t;
                }
            }
        }

        else if (agentId === 'aiTeacher') {
            // Detect concept being taught
            if (resp.includes('let me explain') || resp.includes("let's learn") || resp.includes('here\'s how')) {
                state.phase = 'teaching';
                if (typeof Missions !== 'undefined') Missions.checkAutoComplete('concept_learned');
            }
            // Detect quiz
            if (resp.includes('quiz') || resp.includes('test your understanding') || resp.includes('try this')) {
                state.phase = 'quizzing';
            }
            // Detect correct/incorrect quiz answer
            if (resp.includes('correct!') || resp.includes('great job') || resp.includes('exactly right')) {
                state.understanding = Math.min(1, state.understanding + 0.1);
                state.quizResults.push({ correct: true });
                if (state.understanding > 0.7) state.difficultyLevel = 'hard';
            }
            if (resp.includes('not quite') || resp.includes("that's not") || resp.includes('incorrect')) {
                state.understanding = Math.max(0, state.understanding - 0.1);
                state.quizResults.push({ correct: false });
                if (state.understanding < 0.3) state.difficultyLevel = 'easy';
            }
        }

        return state;
    }

    // ---- Build state context for injection into system prompt ----
    function buildContext(agentId) {
        const state = get(agentId);
        if (!SCHEMAS[agentId]) return '';
        const parts = [];

        if (agentId === 'mockInterview') {
            parts.push(`[AGENT STATE] Interview session active.`);
            if (state.questionsAsked > 0) parts.push(`Questions asked: ${state.questionsAsked}/${state.maxQuestions}`);
            if (state.phase === 'questioning' && state.questionsAsked >= state.maxQuestions - 1) {
                parts.push(`IMPORTANT: You have asked enough questions. Provide the FINAL SCORECARD now with detailed ratings.`);
            }
            if (state.scores.length) {
                const good = state.scores.filter(s => s.score === 'good').length;
                parts.push(`Performance so far: ${good}/${state.scores.length} strong answers`);
            }
            const elapsed = Math.round((Date.now() - state.startTime) / 60000);
            if (elapsed > 0) parts.push(`Session duration: ${elapsed} minutes`);
        }

        else if (agentId === 'codingArena') {
            parts.push(`[AGENT STATE] Coding session active.`);
            parts.push(`Problems solved: ${state.problemsSolved}, Current streak: ${state.streak}`);
            parts.push(`Current difficulty: ${state.currentDifficulty.toUpperCase()}`);
            if (state.topicsCovered.length) parts.push(`Topics covered: ${state.topicsCovered.join(', ')}`);
            if (state.streak >= 3) parts.push(`User is on a ${state.streak}-problem streak! Increase difficulty.`);
            if (state.streak === 0 && state.totalAttempts > 2) parts.push(`User is struggling. Offer simpler problems or hints.`);
        }

        else if (agentId === 'aiTeacher') {
            parts.push(`[AGENT STATE] Teaching session active.`);
            parts.push(`Understanding level: ${Math.round(state.understanding * 100)}%`);
            parts.push(`Difficulty: ${state.difficultyLevel}`);
            if (state.conceptsTaught.length) parts.push(`Concepts taught: ${state.conceptsTaught.join(', ')}`);
            const correctCount = state.quizResults.filter(r => r.correct).length;
            if (state.quizResults.length) parts.push(`Quiz performance: ${correctCount}/${state.quizResults.length} correct`);
            if (state.understanding < 0.3) parts.push(`IMPORTANT: Student is struggling. Simplify explanations significantly. Use more analogies.`);
            if (state.understanding > 0.8) parts.push(`Student is doing excellently. Challenge them with harder concepts.`);
        }

        else if (agentId === 'personality') {
            parts.push(`[AGENT STATE] Personality assessment in progress.`);
            parts.push(`Questions asked: ${state.questionsAsked}/${state.maxQuestions}`);
            if (state.questionsAsked >= state.maxQuestions - 1) {
                parts.push(`IMPORTANT: You have asked enough questions. Now provide the FULL personality analysis.`);
            }
        }

        if (!parts.length) return '';
        return '\n\n' + parts.join('\n');
    }

    return { get, update, reset, parseAndUpdate, buildContext };
})();
