/* NEXUS — Smart Suggestions (Phase 10)
   Auto-generated follow-up question chips after AI responses
*/
const Suggestions = (() => {
    let initialized = false;

    const style = document.createElement('style');
    style.textContent = `
    .suggestion-chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 0;margin-top:6px;animation:suggestFadeIn 0.4s ease}
    @keyframes suggestFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .suggestion-chip{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border:1px solid var(--border);border-radius:20px;background:var(--bg-secondary);color:var(--text-primary);font-size:0.75rem;font-family:var(--font-body);cursor:pointer;transition:all 0.2s;white-space:nowrap;max-width:280px;overflow:hidden;text-overflow:ellipsis}
    .suggestion-chip:hover{border-color:var(--accent);background:var(--accent-alpha, rgba(74,108,247,0.1));transform:translateY(-1px)}
    .suggestion-chip-icon{font-size:0.85rem;flex-shrink:0}
    `;
    document.head.appendChild(style);

    // Patterns to generate follow-up suggestions based on response content
    const patterns = [
        { regex: /\b(python|javascript|java|c\+\+|react|node|css|html|sql|api)\b/i, suggestions: [
            { icon: '💻', text: 'Show me a code example' },
            { icon: '🔧', text: 'How do I debug this?' },
            { icon: '📚', text: 'Best practices for this?' }
        ]},
        { regex: /\b(career|job|resume|interview|salary|company|hire)\b/i, suggestions: [
            { icon: '🎯', text: 'Give me an action plan' },
            { icon: '📝', text: 'Help me prepare for this' },
            { icon: '💡', text: 'What skills should I learn?' }
        ]},
        { regex: /\b(study|exam|test|quiz|learn|course|subject|chapter)\b/i, suggestions: [
            { icon: '📝', text: 'Quiz me on this topic' },
            { icon: '🗂️', text: 'Create flashcards' },
            { icon: '📅', text: 'Make a study plan' }
        ]},
        { regex: /\b(error|bug|issue|problem|fix|solve|crash|fail)\b/i, suggestions: [
            { icon: '🔍', text: 'Explain the root cause' },
            { icon: '🛠️', text: 'Step-by-step fix' },
            { icon: '🛡️', text: 'How to prevent this?' }
        ]},
        { regex: /\b(business|startup|idea|market|product|launch|revenue)\b/i, suggestions: [
            { icon: '📊', text: 'Do a SWOT analysis' },
            { icon: '💰', text: 'Revenue model options' },
            { icon: '🎯', text: 'Create an MVP plan' }
        ]},
        { regex: /\b(health|exercise|diet|sleep|mental|stress|anxiety)\b/i, suggestions: [
            { icon: '🏃', text: 'Give me an exercise routine' },
            { icon: '🥗', text: 'Suggest a meal plan' },
            { icon: '🧘', text: 'Relaxation techniques' }
        ]},
    ];

    // Generic fallbacks
    const fallbacks = [
        { icon: '🔍', text: 'Tell me more about this' },
        { icon: '📝', text: 'Summarize in bullet points' },
        { icon: '🎯', text: 'Give me a practical example' },
        { icon: '💡', text: 'What are the alternatives?' },
        { icon: '📊', text: 'Compare pros and cons' },
        { icon: '🧒', text: 'Explain it simply' },
    ];

    function init() {
        if (initialized) return;
        initialized = true;

        // Observe new AI messages
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('message') && !node.classList?.contains('user-message')) {
                        setTimeout(() => addSuggestions(node), 800);
                    }
                });
            });
        });

        const messagesArea = document.querySelector('.messages-area');
        if (messagesArea) {
            observer.observe(messagesArea, { childList: true });
        }

        console.log('[Suggestions] Initialized');
    }

    function addSuggestions(messageEl) {
        // Don't add if already has suggestions
        if (messageEl.querySelector('.suggestion-chips')) return;

        const bubble = messageEl.querySelector('.message-bubble');
        if (!bubble) return;

        const text = bubble.textContent || '';
        const suggestions = generateSuggestions(text);

        if (!suggestions.length) return;

        const container = document.createElement('div');
        container.className = 'suggestion-chips';

        suggestions.forEach(s => {
            const chip = document.createElement('button');
            chip.className = 'suggestion-chip';
            chip.innerHTML = `<span class="suggestion-chip-icon">${s.icon}</span>${s.text}`;
            chip.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = s.text;
                    input.dispatchEvent(new Event('input'));
                    if (typeof Chat !== 'undefined') Chat.handleSend();
                }
                // Remove all suggestion chips
                document.querySelectorAll('.suggestion-chips').forEach(c => c.remove());
            });
            container.appendChild(chip);
        });

        bubble.after(container);

        // Auto-hide after 30s
        setTimeout(() => {
            container.style.transition = 'opacity 0.5s';
            container.style.opacity = '0';
            setTimeout(() => container.remove(), 500);
        }, 30000);
    }

    function generateSuggestions(text) {
        const matched = [];

        // Check patterns
        for (const p of patterns) {
            if (p.regex.test(text)) {
                matched.push(...p.suggestions);
                break; // Use first match
            }
        }

        // If no pattern matched, use fallbacks
        if (!matched.length) {
            // Pick 3 random fallbacks
            const shuffled = [...fallbacks].sort(() => Math.random() - 0.5);
            matched.push(...shuffled.slice(0, 3));
        }

        // Return max 3
        return matched.slice(0, 3);
    }

    return { init };
})();
