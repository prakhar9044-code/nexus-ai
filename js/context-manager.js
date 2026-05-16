/* NEXUS v4.0 — Context Window Manager
   Manages conversation history to prevent token overflow.
   Summarizes old messages, preserves recent context,
   and ensures the AI always has the right amount of history.
*/
const ContextManager = (() => {
    const MAX_TURNS = 20;          // Max conversation turns before trimming
    const SUMMARY_THRESHOLD = 12;  // Summarize when turns exceed this
    const KEEP_RECENT = 6;         // Always keep the last N turns

    // Stored summaries per conversation
    const summaries = {};

    // ---- Check if conversation needs trimming ----
    function needsTrim(featureId) {
        const conv = Nexus.getConversation(featureId);
        return conv.length > MAX_TURNS;
    }

    // ---- Trim conversation with summary injection ----
    function trimConversation(featureId) {
        const conv = Nexus.getConversation(featureId);
        if (conv.length <= SUMMARY_THRESHOLD) return;

        // Extract old messages to summarize
        const oldMessages = conv.slice(0, conv.length - KEEP_RECENT);
        const recentMessages = conv.slice(-KEEP_RECENT);

        // Build a text summary of old messages
        const summaryText = buildSummary(oldMessages);

        // Store the summary
        if (!summaries[featureId]) summaries[featureId] = [];
        summaries[featureId].push(summaryText);

        // Replace conversation: inject summary as first message + keep recent
        conv.length = 0;
        conv.push({
            role: 'user',
            parts: [{ text: `[CONVERSATION SUMMARY - Earlier in this conversation we discussed: ${summaryText}]` }]
        });
        conv.push({
            role: 'model',
            parts: [{ text: 'Understood. I have the context from our earlier conversation. Let me continue helping you.' }]
        });
        // Re-add recent messages
        recentMessages.forEach(m => conv.push(m));

        console.log(`🧹 Context trimmed for ${featureId}: ${oldMessages.length} old messages summarized, ${recentMessages.length} recent kept`);
    }

    // ---- Build text summary from messages ----
    function buildSummary(messages) {
        const points = [];
        messages.forEach(msg => {
            const text = msg.parts?.[0]?.text || '';
            if (!text || text.length < 10) return;
            if (msg.role === 'user') {
                // Extract the core ask
                const trimmed = text.slice(0, 100).replace(/\n/g, ' ');
                points.push(`User asked: "${trimmed}"`);
            } else {
                // Extract key topics from AI response
                const topics = extractTopics(text);
                if (topics.length) {
                    points.push(`AI covered: ${topics.join(', ')}`);
                }
            }
        });
        return points.slice(0, 8).join('. '); // Cap at 8 points
    }

    // ---- Extract key topics from a response ----
    function extractTopics(text) {
        const topics = [];
        // Look for headers
        const headers = text.match(/^#{1,3}\s+(.+)$/gm);
        if (headers) {
            headers.slice(0, 3).forEach(h => topics.push(h.replace(/^#+\s+/, '').slice(0, 40)));
        }
        // Look for key action items or conclusions
        const bullets = text.match(/^\s*[-*]\s+\*\*(.+?)\*\*/gm);
        if (bullets) {
            bullets.slice(0, 3).forEach(b => topics.push(b.replace(/^\s*[-*]\s+\*\*/, '').replace(/\*\*.*/, '').slice(0, 40)));
        }
        return topics.slice(0, 4);
    }

    // ---- Get full context string (summaries + recent) ----
    function getFullContext(featureId) {
        const pastSummaries = summaries[featureId] || [];
        if (!pastSummaries.length) return '';
        return '\n[PAST CONTEXT: ' + pastSummaries.join(' | ') + ']';
    }

    // ---- Pre-process before API call ----
    function preProcess(featureId) {
        if (needsTrim(featureId)) {
            trimConversation(featureId);
        }
    }

    // ---- Get conversation stats ----
    function getStats(featureId) {
        const conv = Nexus.getConversation(featureId);
        const totalChars = conv.reduce((sum, m) => sum + (m.parts?.[0]?.text?.length || 0), 0);
        return {
            turns: conv.length,
            totalChars,
            estimatedTokens: Math.round(totalChars / 4),
            hasSummary: !!(summaries[featureId]?.length),
            summaryCount: summaries[featureId]?.length || 0
        };
    }

    return { preProcess, trimConversation, getFullContext, getStats, needsTrim };
})();
