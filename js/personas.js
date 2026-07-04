/* NEXUS — AI Personas (Phase 10)
   6 distinct AI personalities with custom system prompts, avatar colors, greetings
*/
const Personas = (() => {
    let initialized = false;
    let current = localStorage.getItem('nexus_persona') || 'scholar';

    const list = {
        scholar: {
            id: 'scholar', name: 'Scholar', icon: '🧠', color: '#4a6cf7',
            greeting: 'Greetings! I\'m ready for deep, analytical discourse.',
            desc: 'Formal, academic, thorough',
            prompt: 'You are a scholarly academic assistant. Use precise, formal language. Cite concepts and theories when relevant. Provide thorough, well-structured answers with clear reasoning. Use professional vocabulary and organize responses with clear headings and bullet points.'
        },
        coach: {
            id: 'coach', name: 'Coach', icon: '🎯', color: '#ef4444',
            greeting: 'Let\'s crush it today! What are we working on? 💪',
            desc: 'Motivational, action-oriented',
            prompt: 'You are a motivational coach and mentor. Be encouraging but direct. Push the user to take action. Use motivational language, give actionable advice, and hold them accountable. Ask challenging questions. Use power phrases and be energetic. Include action steps in every response.'
        },
        buddy: {
            id: 'buddy', name: 'Buddy', icon: '🎮', color: '#22c55e',
            greeting: 'Yo! What\'s up? 😎 Let\'s figure this out together!',
            desc: 'Casual, fun, uses emojis',
            prompt: 'You are a friendly, casual buddy. Use informal language, slang, emojis, and humor. Make learning fun and relatable. Use pop culture references and memes when appropriate. Keep things light but still helpful. Be like a smart friend who explains things in a chill way.'
        },
        engineer: {
            id: 'engineer', name: 'Engineer', icon: '👨‍💻', color: '#06b6d4',
            greeting: 'Systems online. Ready for technical analysis.',
            desc: 'Technical, precise, code-focused',
            prompt: 'You are a senior software engineer. Be extremely technical and precise. Always provide code examples when relevant. Use proper technical terminology. Discuss trade-offs, complexity, and best practices. Format code properly with syntax highlighting. Be concise and efficient in explanations.'
        },
        creative: {
            id: 'creative', name: 'Creative', icon: '🎨', color: '#a855f7',
            greeting: 'Let\'s paint with ideas today! ✨ What inspires you?',
            desc: 'Artistic, metaphorical, storytelling',
            prompt: 'You are a creative storyteller and artist. Use vivid metaphors, analogies, and storytelling to explain concepts. Think outside the box. Be imaginative and inspire creativity. Use rich, descriptive language. Connect ideas to art, music, and culture. Make every explanation a narrative journey.'
        },
        tutor: {
            id: 'tutor', name: 'Tutor', icon: '🧒', color: '#f59e0b',
            greeting: 'Hi there! 📚 Let\'s learn something new step by step!',
            desc: 'Patient, simple, step-by-step',
            prompt: 'You are a patient, caring tutor for young learners. Explain everything in simple, easy-to-understand language. Break down complex topics into small steps. Use lots of examples and analogies kids would understand. Be encouraging and celebrate small wins. Ask check-in questions like "Does that make sense?" Use simple vocabulary.'
        }
    };

    const style = document.createElement('style');
    style.textContent = `
    .persona-selector{position:relative;display:inline-flex;align-items:center;z-index:500}
    .persona-btn{display:flex;align-items:center;gap:6px;padding:5px 12px;border:1px solid var(--border);border-radius:20px;background:var(--bg-secondary);color:var(--text-primary);font-size:0.78rem;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all 0.2s;white-space:nowrap}
    .persona-btn:hover{border-color:var(--accent);background:var(--bg-hover)}
    .persona-btn .persona-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
    .persona-backdrop{position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,0.3);backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:all 0.2s}
    .persona-backdrop.active{opacity:1;visibility:visible}
    .persona-dropdown{position:fixed;top:60px;left:50%;transform:translateX(-50%) scale(0.95);background:var(--bg-primary);border:1px solid var(--border);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,0.35);min-width:260px;max-width:320px;z-index:9500;opacity:0;visibility:hidden;transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);overflow:hidden}
    .persona-dropdown.active{opacity:1;visibility:visible;transform:translateX(-50%) scale(1)}
    .persona-dropdown-header{padding:12px 16px;border-bottom:1px solid var(--border);font-size:0.72rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px}
    .persona-option{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;transition:background 0.15s}
    .persona-option:hover{background:var(--bg-hover)}
    .persona-option:last-child{border-radius:0 0 14px 14px}
    .persona-option.active{background:var(--accent-alpha, rgba(74,108,247,0.1))}
    .persona-option-icon{font-size:1.2rem;width:28px;text-align:center}
    .persona-option-info{flex:1}
    .persona-option-name{font-size:0.82rem;font-weight:600;color:var(--text-primary)}
    .persona-option-desc{font-size:0.68rem;color:var(--text-tertiary)}
    .persona-option-check{font-size:0.75rem;color:var(--accent);opacity:0}
    .persona-option.active .persona-option-check{opacity:1}
    @media(max-width:768px){.persona-dropdown{left:10px;right:10px;transform:scale(0.95);min-width:auto}.persona-dropdown.active{transform:scale(1)}}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        injectSelector();
        console.log('[Personas] Initialized — active:', current);
    }

    function injectSelector() {
        const headerLeft = document.querySelector('.header-left');
        if (!headerLeft) return;

        const p = list[current];

        // Button in header
        const container = document.createElement('div');
        container.className = 'persona-selector';
        container.id = 'persona-selector';
        container.innerHTML = `
            <button class="persona-btn" id="persona-btn">
                <span class="persona-dot" style="background:${p.color}"></span>
                ${p.icon} ${p.name}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
        `;
        headerLeft.appendChild(container);

        // Backdrop + Dropdown on body (for proper z-index stacking)
        const backdrop = document.createElement('div');
        backdrop.className = 'persona-backdrop';
        backdrop.id = 'persona-backdrop';
        document.body.appendChild(backdrop);

        const dropdown = document.createElement('div');
        dropdown.className = 'persona-dropdown';
        dropdown.id = 'persona-dropdown';
        dropdown.innerHTML = `
            <div class="persona-dropdown-header">Choose AI Persona</div>
            ${Object.values(list).map(persona => `
                <div class="persona-option ${persona.id === current ? 'active' : ''}" data-id="${persona.id}">
                    <span class="persona-option-icon">${persona.icon}</span>
                    <div class="persona-option-info">
                        <div class="persona-option-name">${persona.name}</div>
                        <div class="persona-option-desc">${persona.desc}</div>
                    </div>
                    <span class="persona-option-check">✓</span>
                </div>
            `).join('')}
        `;
        document.body.appendChild(dropdown);

        // Toggle dropdown + backdrop
        document.getElementById('persona-btn').addEventListener('click', e => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('active');
            if (isOpen) {
                dropdown.classList.remove('active');
                backdrop.classList.remove('active');
            } else {
                dropdown.classList.add('active');
                backdrop.classList.add('active');
            }
        });

        // Close on backdrop click
        backdrop.addEventListener('click', () => {
            dropdown.classList.remove('active');
            backdrop.classList.remove('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#persona-btn') && !e.target.closest('#persona-dropdown')) {
                dropdown.classList.remove('active');
                backdrop.classList.remove('active');
            }
        });

        // Select persona
        dropdown.querySelectorAll('.persona-option').forEach(opt => {
            opt.addEventListener('click', () => {
                setPersona(opt.dataset.id);
                dropdown.classList.remove('active');
                backdrop.classList.remove('active');
            });
        });
    }

    function setPersona(id) {
        if (!list[id]) return;
        current = id;
        localStorage.setItem('nexus_persona', id);

        // Update button
        const btn = document.getElementById('persona-btn');
        const p = list[id];
        if (btn) {
            btn.innerHTML = `<span class="persona-dot" style="background:${p.color}"></span>${p.icon} ${p.name}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>`;
        }

        // Update active state
        document.querySelectorAll('.persona-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.id === id);
        });

        Toast.show(`${p.icon} Switched to ${p.name} mode`, 'success');
    }

    function getSystemPrompt() {
        return list[current]?.prompt || '';
    }

    function getCurrent() { return list[current] || list.scholar; }
    function getAll() { return list; }

    return { init, getSystemPrompt, getCurrent, getAll, setPersona };
})();
