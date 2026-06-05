/* NEXUS — Prompt Templates Library (Phase 9)
   40+ templates across 6 categories, `/` shortcut, search, favorites
*/
const Templates = (() => {
    let initialized = false;
    let favorites = JSON.parse(localStorage.getItem('nexus_template_favs') || '[]');

    const categories = [
        {
            id: 'coding', icon: '💻', name: 'Coding',
            items: [
                { title: 'Debug Code', prompt: 'I have this code that\'s not working:\n```\n[paste code]\n```\nPlease help me find and fix the bug.' },
                { title: 'Explain Code', prompt: 'Please explain this code step by step:\n```\n[paste code]\n```' },
                { title: 'Refactor Code', prompt: 'Refactor this code to be cleaner, more efficient, and follow best practices:\n```\n[paste code]\n```' },
                { title: 'Write Unit Tests', prompt: 'Write comprehensive unit tests for this function:\n```\n[paste code]\n```' },
                { title: 'Code Review', prompt: 'Review this code for potential issues, security vulnerabilities, and suggest improvements:\n```\n[paste code]\n```' },
                { title: 'Convert Language', prompt: 'Convert this code from [source language] to [target language]:\n```\n[paste code]\n```' },
                { title: 'Regex Help', prompt: 'Write a regex pattern that matches: [describe pattern]. Include test cases.' },
                { title: 'API Design', prompt: 'Design a REST API for a [describe system]. Include endpoints, methods, request/response schemas.' },
            ]
        },
        {
            id: 'career', icon: '🎯', name: 'Career',
            items: [
                { title: 'Resume Review', prompt: 'Review my resume and suggest improvements for a [job title] position:\n[paste resume]' },
                { title: 'Cover Letter', prompt: 'Write a compelling cover letter for a [job title] position at [company]. My key skills are: [skills]' },
                { title: 'Interview Prep', prompt: 'Give me 10 common interview questions for a [job title] role with sample answers and tips.' },
                { title: 'Salary Negotiation', prompt: 'Help me prepare for salary negotiation. Current offer: [amount]. My experience: [years]. Role: [title]' },
                { title: 'LinkedIn Optimize', prompt: 'Optimize my LinkedIn headline and summary for a [job title] role. Current: [paste current]' },
                { title: 'Career Switch', prompt: 'I want to switch from [current field] to [target field]. Create a 6-month transition plan.' },
                { title: 'Skill Roadmap', prompt: 'Create a learning roadmap to become a [target role] from scratch, with timeline and resources.' },
            ]
        },
        {
            id: 'study', icon: '📚', name: 'Study',
            items: [
                { title: 'Explain Concept', prompt: 'Explain [concept] in simple terms with real-world examples. I\'m a [level] student.' },
                { title: 'Quiz Me', prompt: 'Create a 10-question quiz on [topic] with multiple choice answers. Show answers at the end.' },
                { title: 'Summarize Topic', prompt: 'Give me a comprehensive summary of [topic] covering all key points, in bullet points.' },
                { title: 'Study Plan', prompt: 'Create a 2-week study plan for [exam/subject]. I can study [hours] per day.' },
                { title: 'Flashcards', prompt: 'Create 15 flashcards (question & answer) for studying [topic].' },
                { title: 'Compare & Contrast', prompt: 'Compare and contrast [concept A] vs [concept B] in a clear table format.' },
                { title: 'ELI5', prompt: 'Explain [complex topic] like I\'m 5 years old. Use analogies and simple language.' },
                { title: 'Practice Problems', prompt: 'Give me 5 practice problems on [topic] with step-by-step solutions.' },
            ]
        },
        {
            id: 'writing', icon: '✍️', name: 'Writing',
            items: [
                { title: 'Email Draft', prompt: 'Write a professional email to [recipient] about [topic]. Tone: [formal/casual].' },
                { title: 'Essay Outline', prompt: 'Create a detailed essay outline on [topic]. Include thesis, 3 body paragraphs, and conclusion.' },
                { title: 'Proofread', prompt: 'Proofread and improve this text for grammar, clarity, and flow:\n[paste text]' },
                { title: 'Blog Post', prompt: 'Write a 500-word blog post about [topic]. Make it engaging with a catchy intro and SEO-friendly.' },
                { title: 'Social Media', prompt: 'Write 5 social media posts about [topic] for [platform]. Include hashtags and emojis.' },
                { title: 'Presentation', prompt: 'Create a 10-slide presentation outline on [topic] with key points for each slide.' },
            ]
        },
        {
            id: 'brainstorm', icon: '🧠', name: 'Brainstorm',
            items: [
                { title: 'Idea Generator', prompt: 'Generate 10 creative project ideas related to [field/topic]. Include brief descriptions.' },
                { title: 'Pros & Cons', prompt: 'Give me a detailed pros and cons analysis of [decision/topic].' },
                { title: 'Problem Solve', prompt: 'Help me solve this problem: [describe problem]. Think step by step and suggest multiple approaches.' },
                { title: 'Business Idea', prompt: 'Validate this business idea: [idea]. Analyze market, competition, feasibility, and potential.' },
                { title: 'Mind Map', prompt: 'Create a text-based mind map for [topic] with main branches and sub-topics.' },
                { title: 'SWOT Analysis', prompt: 'Perform a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for [subject].' },
            ]
        },
        {
            id: 'tools', icon: '🔧', name: 'Tools',
            items: [
                { title: 'Translate', prompt: 'Translate the following text from [source lang] to [target lang]:\n[paste text]' },
                { title: 'Summarize', prompt: 'Summarize this in 3 bullet points:\n[paste text]' },
                { title: 'Data Analyze', prompt: 'Analyze this data and give me key insights:\n[paste data]' },
                { title: 'Math Solver', prompt: 'Solve this math problem step by step: [problem]' },
                { title: 'JSON/CSV Convert', prompt: 'Convert this data to [JSON/CSV/table] format:\n[paste data]' },
            ]
        }
    ];

    const style = document.createElement('style');
    style.textContent = `
    .tmpl-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);display:flex;align-items:flex-start;justify-content:center;padding-top:min(12vh,100px);opacity:0;visibility:hidden;transition:all 0.25s}
    .tmpl-overlay.active{opacity:1;visibility:visible}
    .tmpl-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:min(620px,92vw);max-height:75vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.5);transform:translateY(-16px) scale(0.96);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .tmpl-overlay.active .tmpl-modal{transform:translateY(0) scale(1)}
    .tmpl-header{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid var(--border)}
    .tmpl-header h3{font-size:1rem;font-weight:700;margin:0;flex:1}
    .tmpl-close{background:none;border:none;color:var(--text-tertiary);font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:8px}
    .tmpl-close:hover{background:var(--bg-hover);color:var(--text-primary)}
    .tmpl-search{padding:0 16px 12px}
    .tmpl-search input{width:100%;padding:8px 14px;border:1px solid var(--border);border-radius:10px;background:var(--bg-secondary);color:var(--text-primary);font-family:var(--font-body);font-size:0.85rem;outline:none}
    .tmpl-search input:focus{border-color:var(--accent)}
    .tmpl-body{flex:1;overflow-y:auto;padding:0 12px 12px}
    .tmpl-category{margin-bottom:12px}
    .tmpl-category-header{display:flex;align-items:center;gap:8px;padding:6px 8px;font-size:0.78rem;font-weight:700;color:var(--text-secondary);cursor:pointer;border-radius:8px;transition:background 0.15s}
    .tmpl-category-header:hover{background:var(--bg-hover)}
    .tmpl-category-icon{font-size:1.1rem}
    .tmpl-category-count{margin-left:auto;font-size:0.68rem;color:var(--text-tertiary);font-weight:500}
    .tmpl-items{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:4px 0}
    .tmpl-item{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all 0.2s;font-size:0.8rem;color:var(--text-primary);background:var(--bg-secondary)}
    .tmpl-item:hover{border-color:var(--accent);transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
    .tmpl-item-title{flex:1;font-weight:600}
    .tmpl-item-fav{background:none;border:none;cursor:pointer;font-size:0.8rem;opacity:0.3;transition:all 0.2s;padding:2px}
    .tmpl-item-fav:hover,.tmpl-item-fav.active{opacity:1}
    .tmpl-favs-section{margin-bottom:16px;padding:0 8px}
    .tmpl-favs-label{font-size:0.72rem;font-weight:700;color:var(--accent);margin-bottom:6px}
    @media(max-width:500px){.tmpl-items{grid-template-columns:1fr}.tmpl-modal{max-height:85vh}}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;

        const overlay = document.createElement('div');
        overlay.className = 'tmpl-overlay';
        overlay.id = 'tmpl-overlay';
        overlay.innerHTML = `
            <div class="tmpl-modal">
                <div class="tmpl-header"><h3>📝 Prompt Templates</h3><button class="tmpl-close" id="tmpl-close">✕</button></div>
                <div class="tmpl-search"><input id="tmpl-search-input" placeholder="Search templates..."></div>
                <div class="tmpl-body" id="tmpl-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.getElementById('tmpl-close').addEventListener('click', close);
        document.getElementById('tmpl-search-input').addEventListener('input', e => render(e.target.value.trim()));

        // `/` key shortcut (only when no input focused)
        document.addEventListener('keydown', e => {
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                toggle();
            }
        });

        render();
        console.log('[Templates] Initialized');
    }

    function render(filter = '') {
        const body = document.getElementById('tmpl-body');
        if (!body) return;
        const lf = filter.toLowerCase();
        let html = '';

        // Favorites section
        if (!filter && favorites.length) {
            const favItems = [];
            categories.forEach(cat => {
                cat.items.forEach(item => {
                    if (favorites.includes(item.title)) favItems.push({ ...item, catIcon: cat.icon });
                });
            });
            if (favItems.length) {
                html += `<div class="tmpl-favs-section"><div class="tmpl-favs-label">⭐ Favorites</div><div class="tmpl-items">`;
                favItems.forEach(item => {
                    html += `<div class="tmpl-item" data-prompt="${escHtml(item.prompt)}">${item.catIcon} <span class="tmpl-item-title">${item.title}</span></div>`;
                });
                html += `</div></div>`;
            }
        }

        categories.forEach(cat => {
            const filtered = filter ? cat.items.filter(i => i.title.toLowerCase().includes(lf) || i.prompt.toLowerCase().includes(lf)) : cat.items;
            if (!filtered.length) return;

            html += `<div class="tmpl-category">
                <div class="tmpl-category-header"><span class="tmpl-category-icon">${cat.icon}</span>${cat.name}<span class="tmpl-category-count">${filtered.length}</span></div>
                <div class="tmpl-items">`;
            filtered.forEach(item => {
                const isFav = favorites.includes(item.title);
                html += `<div class="tmpl-item" data-prompt="${escHtml(item.prompt)}">
                    <span class="tmpl-item-title">${item.title}</span>
                    <button class="tmpl-item-fav ${isFav ? 'active' : ''}" data-title="${escHtml(item.title)}" title="Favorite">⭐</button>
                </div>`;
            });
            html += `</div></div>`;
        });

        if (!html) html = '<div class="search-empty"><div class="search-empty-icon">📝</div>No templates match your search</div>';
        body.innerHTML = html;

        // Click handlers
        body.querySelectorAll('.tmpl-item').forEach(el => {
            el.addEventListener('click', e => {
                if (e.target.closest('.tmpl-item-fav')) return;
                const prompt = el.dataset.prompt;
                insertPrompt(prompt);
                close();
            });
        });
        body.querySelectorAll('.tmpl-item-fav').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const title = btn.dataset.title;
                const idx = favorites.indexOf(title);
                if (idx >= 0) favorites.splice(idx, 1); else favorites.push(title);
                localStorage.setItem('nexus_template_favs', JSON.stringify(favorites));
                btn.classList.toggle('active');
            });
        });
    }

    function insertPrompt(prompt) {
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = prompt;
            input.dispatchEvent(new Event('input'));
            input.focus();
            // Place cursor at first [bracket]
            const bracketIdx = prompt.indexOf('[');
            if (bracketIdx >= 0) {
                const endIdx = prompt.indexOf(']', bracketIdx);
                if (endIdx >= 0) input.setSelectionRange(bracketIdx, endIdx + 1);
            }
        }
    }

    function escHtml(s) { return s.replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    function open() {
        document.getElementById('tmpl-overlay')?.classList.add('active');
        setTimeout(() => document.getElementById('tmpl-search-input')?.focus(), 100);
    }
    function close() {
        document.getElementById('tmpl-overlay')?.classList.remove('active');
        const input = document.getElementById('tmpl-search-input');
        if (input) input.value = '';
        render();
    }
    function toggle() {
        const overlay = document.getElementById('tmpl-overlay');
        if (overlay?.classList.contains('active')) close(); else open();
    }

    return { init, open, close, toggle };
})();
