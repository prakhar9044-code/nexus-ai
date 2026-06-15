/* NEXUS — Memory Dashboard (Phase 10)
   Visual panel showing what Nexus remembers about the user
*/
const MemoryViz = (() => {
    let initialized = false;

    const style = document.createElement('style');
    style.textContent = `
    .memory-panel{padding:24px;max-width:700px;margin:0 auto}
    .memory-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
    .memory-header h2{font-size:1.3rem;font-weight:700;display:flex;align-items:center;gap:8px}
    .memory-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
    .memory-stat-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:14px;padding:16px;text-align:center}
    .memory-stat-value{font-size:1.5rem;font-weight:700;color:var(--accent)}
    .memory-stat-label{font-size:0.72rem;color:var(--text-tertiary);margin-top:4px}
    .memory-section{margin-bottom:20px}
    .memory-section-title{font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:10px;display:flex;align-items:center;gap:6px}
    .memory-fact{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;margin-bottom:6px;transition:all 0.2s}
    .memory-fact:hover{border-color:var(--accent);transform:translateX(4px)}
    .memory-fact-icon{font-size:1.1rem;flex-shrink:0}
    .memory-fact-content{flex:1;min-width:0}
    .memory-fact-key{font-size:0.72rem;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.3px}
    .memory-fact-value{font-size:0.85rem;color:var(--text-primary);margin-top:2px;word-break:break-word}
    .memory-fact-delete{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;border-radius:6px;font-size:0.85rem;transition:all 0.2s;flex-shrink:0}
    .memory-fact-delete:hover{color:#ef4444;background:rgba(239,68,68,0.1)}
    .memory-empty{text-align:center;padding:40px 20px;color:var(--text-tertiary)}
    .memory-empty-icon{font-size:3rem;margin-bottom:8px}
    .memory-clear-btn{padding:8px 18px;border:1px solid #ef4444;color:#ef4444;background:none;border-radius:10px;cursor:pointer;font-size:0.78rem;font-weight:600;font-family:var(--font-body);transition:all 0.2s}
    .memory-clear-btn:hover{background:#ef4444;color:#fff}
    .memory-summary{background:linear-gradient(135deg,var(--accent-alpha, rgba(74,108,247,0.08)),rgba(34,197,94,0.08));border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:20px}
    .memory-summary h3{font-size:0.88rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px}
    .memory-summary p{font-size:0.82rem;color:var(--text-secondary);line-height:1.6}
    @media(max-width:500px){.memory-stats{grid-template-columns:1fr}.memory-panel{padding:16px}}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[MemoryViz] Initialized');
    }

    function render(container) {
        if (!container) return;
        const facts = getAllFacts();
        const totalFacts = facts.length;
        const lastUpdated = localStorage.getItem('nexus_memory_updated') || 'Never';
        const chatCount = Object.keys(JSON.parse(localStorage.getItem('nexus_chats') || '{}')).length;

        let html = `<div class="memory-panel">
            <div class="memory-header">
                <h2>🧠 Memory Dashboard</h2>
                ${totalFacts > 0 ? '<button class="memory-clear-btn" id="memory-clear-all">🗑️ Clear All</button>' : ''}
            </div>

            <div class="memory-stats">
                <div class="memory-stat-card"><div class="memory-stat-value">${totalFacts}</div><div class="memory-stat-label">Facts Stored</div></div>
                <div class="memory-stat-card"><div class="memory-stat-value">${chatCount}</div><div class="memory-stat-label">Conversations</div></div>
                <div class="memory-stat-card"><div class="memory-stat-value">${getStorageSize()}</div><div class="memory-stat-label">Storage Used</div></div>
            </div>`;

        if (totalFacts > 0) {
            // Summary card
            const persona = typeof Personas !== 'undefined' ? Personas.getCurrent() : { icon: '🧠', name: 'Scholar' };
            const userName = localStorage.getItem('nexus_student_name') || 'User';
            const level = localStorage.getItem('nexus_user_level') || 'college';
            html += `<div class="memory-summary">
                <h3>💡 What Nexus Knows About You</h3>
                <p>Hi <strong>${userName}</strong>! You're a <strong>${level}</strong> level user currently using the <strong>${persona.icon} ${persona.name}</strong> persona. 
                Nexus has learned <strong>${totalFacts} facts</strong> about you across <strong>${chatCount} conversations</strong>.</p>
            </div>`;

            // Group facts by category
            const categories = groupFacts(facts);
            Object.entries(categories).forEach(([cat, items]) => {
                const icons = { profile: '👤', preferences: '⚙️', interests: '🎯', context: '💬', other: '📝' };
                html += `<div class="memory-section">
                    <div class="memory-section-title">${icons[cat] || '📝'} ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${items.length})</div>
                    ${items.map((f, i) => `
                        <div class="memory-fact" data-key="${escHtml(f.key)}">
                            <span class="memory-fact-icon">${f.icon || '💡'}</span>
                            <div class="memory-fact-content">
                                <div class="memory-fact-key">${escHtml(f.key)}</div>
                                <div class="memory-fact-value">${escHtml(f.value)}</div>
                            </div>
                            <button class="memory-fact-delete" data-key="${escHtml(f.key)}" title="Delete">✕</button>
                        </div>
                    `).join('')}
                </div>`;
            });
        } else {
            html += `<div class="memory-empty">
                <div class="memory-empty-icon">🧠</div>
                <p>No memories yet! Chat with Nexus and it will learn about you over time.</p>
            </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;

        // Event handlers
        container.querySelectorAll('.memory-fact-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteFact(btn.dataset.key);
                render(container);
                Toast.show('Memory deleted', 'info');
            });
        });

        document.getElementById('memory-clear-all')?.addEventListener('click', () => {
            if (confirm('Clear ALL memories? This cannot be undone.')) {
                clearAll();
                render(container);
                Toast.show('All memories cleared', 'info');
            }
        });
    }

    function getAllFacts() {
        const facts = [];
        // From localStorage keys
        const keys = {
            'nexus_student_name': { key: 'Name', icon: '👤', cat: 'profile' },
            'nexus_user_level': { key: 'Level', icon: '🎓', cat: 'profile' },
            'nexus_lang': { key: 'Language', icon: '🌍', cat: 'preferences' },
            'nexus_theme_id': { key: 'Theme', icon: '🎨', cat: 'preferences' },
            'nexus_accent': { key: 'Accent Color', icon: '🎨', cat: 'preferences' },
            'nexus_font_size': { key: 'Font Size', icon: '🔤', cat: 'preferences' },
            'nexus_persona': { key: 'AI Persona', icon: '🎭', cat: 'preferences' },
            'nexus_xp': { key: 'Total XP', icon: '⭐', cat: 'profile' },
            'nexus_level': { key: 'Level', icon: '🏆', cat: 'profile' },
            'nexus_streak': { key: 'Current Streak', icon: '🔥', cat: 'profile' },
        };

        Object.entries(keys).forEach(([lsKey, meta]) => {
            const val = localStorage.getItem(lsKey);
            if (val && val !== 'null' && val !== 'undefined') {
                facts.push({ key: meta.key, value: val, icon: meta.icon, category: meta.cat });
            }
        });

        // From Memory module
        if (typeof Memory !== 'undefined' && Memory.getContext) {
            try {
                const ctx = Memory.getContext();
                if (ctx && typeof ctx === 'string' && ctx.length > 10) {
                    const lines = ctx.split('\n').filter(l => l.trim() && !l.startsWith('Context'));
                    lines.forEach(line => {
                        const clean = line.replace(/^[-•]\s*/, '').trim();
                        if (clean.length > 5) {
                            facts.push({ key: 'Learned', value: clean, icon: '💡', category: 'context' });
                        }
                    });
                }
            } catch (e) {}
        }

        return facts;
    }

    function groupFacts(facts) {
        const groups = {};
        facts.forEach(f => {
            const cat = f.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(f);
        });
        return groups;
    }

    function deleteFact(key) {
        // Try to remove from localStorage-based facts
        const keyMap = {
            'Name': 'nexus_student_name', 'Level': 'nexus_user_level',
            'Language': 'nexus_lang', 'Theme': 'nexus_theme_id',
            'Accent Color': 'nexus_accent', 'Font Size': 'nexus_font_size',
            'AI Persona': 'nexus_persona', 'Total XP': 'nexus_xp',
            'Current Streak': 'nexus_streak'
        };
        if (keyMap[key]) localStorage.removeItem(keyMap[key]);
        localStorage.setItem('nexus_memory_updated', new Date().toISOString());
    }

    function clearAll() {
        const preserve = ['nexus_api_key', 'nexus_chats', 'nexus_current_chat'];
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('nexus_') && !preserve.includes(key)) {
                toRemove.push(key);
            }
        }
        toRemove.forEach(k => localStorage.removeItem(k));
        if (typeof Memory !== 'undefined' && Memory.clear) Memory.clear();
    }

    function getStorageSize() {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('nexus_')) {
                total += (localStorage.getItem(key) || '').length * 2; // UTF-16
            }
        }
        if (total < 1024) return total + ' B';
        if (total < 1048576) return (total / 1024).toFixed(1) + ' KB';
        return (total / 1048576).toFixed(1) + ' MB';
    }

    function escHtml(s) { return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    return { init, render };
})();
