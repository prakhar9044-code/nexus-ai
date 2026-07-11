/* ============================================
   NEXUS — Study Planner & Pomodoro Timer
   Phase 14.2: Tasks, Pomodoro, Study Stats
   ============================================ */
const Planner = (() => {
    const TASKS_KEY = 'nexus_planner_tasks';
    const SESSIONS_KEY = 'nexus_planner_sessions';
    let tasks = [], sessions = [], timerInterval = null, timeLeft = 25*60, isRunning = false;
    let currentTab = 'tasks', pomodoroCount = 0, mode = 'focus'; // focus|break|longbreak

    const style = document.createElement('style');
    style.textContent = `
    .planner-overlay{position:fixed;inset:0;z-index:9650;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .planner-overlay.active{opacity:1;visibility:visible}
    .planner-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;width:520px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.92);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .planner-overlay.active .planner-modal{transform:scale(1)}
    .planner-header{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
    .planner-header h2{font-size:1.05rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px}
    .planner-close{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:6px;border-radius:8px;font-size:1.1rem;transition:all 0.2s}
    .planner-close:hover{color:var(--text-primary);background:var(--bg-hover)}
    .planner-tabs{display:flex;gap:2px;padding:10px 16px 0;border-bottom:1px solid var(--border)}
    .planner-tab{padding:8px 16px;font-size:0.8rem;font-weight:500;color:var(--text-tertiary);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;transition:all 0.2s;font-family:var(--font-body)}
    .planner-tab.active{color:var(--accent);border-bottom-color:var(--accent)}
    .planner-tab:hover{color:var(--text-primary)}
    .planner-body{flex:1;overflow-y:auto;padding:16px 20px}
    .planner-add-row{display:flex;gap:8px;margin-bottom:14px}
    .planner-add-row input,.planner-add-row select{flex:1;padding:8px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:0.8rem;font-family:var(--font-body);outline:none}
    .planner-add-row input:focus,.planner-add-row select:focus{border-color:var(--accent)}
    .planner-add-btn{padding:8px 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:all 0.2s;white-space:nowrap}
    .planner-add-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .planner-task{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:6px;background:var(--bg-secondary);border:1px solid var(--border);transition:all 0.2s}
    .planner-task:hover{border-color:var(--text-tertiary)}
    .planner-task.done{opacity:0.5}
    .planner-task.done .planner-task-title{text-decoration:line-through}
    .planner-task input[type=checkbox]{width:16px;height:16px;accent-color:var(--accent);cursor:pointer}
    .planner-task-title{flex:1;font-size:0.82rem;color:var(--text-primary);font-weight:500}
    .planner-task-pri{font-size:0.6rem;padding:2px 6px;border-radius:6px;font-weight:600;text-transform:uppercase}
    .planner-task-pri.high{background:rgba(239,68,68,0.15);color:#ef4444}
    .planner-task-pri.medium{background:rgba(245,158,11,0.15);color:#f59e0b}
    .planner-task-pri.low{background:rgba(34,197,94,0.15);color:#22c55e}
    .planner-task-del{background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:0.9rem;padding:4px;border-radius:6px;transition:all 0.2s}
    .planner-task-del:hover{color:#ef4444;background:rgba(239,68,68,0.1)}
    .planner-empty{text-align:center;padding:30px;color:var(--text-tertiary);font-size:0.85rem}
    .pomo-container{display:flex;flex-direction:column;align-items:center;gap:16px;padding:10px 0}
    .pomo-ring{position:relative;width:180px;height:180px}
    .pomo-ring svg{width:180px;height:180px;transform:rotate(-90deg)}
    .pomo-ring circle{fill:none;stroke-width:6;stroke-linecap:round}
    .pomo-ring .bg{stroke:var(--border)}
    .pomo-ring .fg{stroke:var(--accent);transition:stroke-dashoffset 1s linear}
    .pomo-time{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .pomo-time-display{font-size:2.4rem;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);letter-spacing:2px}
    .pomo-mode-label{font-size:0.72rem;color:var(--text-tertiary);text-transform:uppercase;font-weight:600;margin-top:2px}
    .pomo-controls{display:flex;gap:10px}
    .pomo-btn{padding:10px 24px;border-radius:12px;border:none;cursor:pointer;font-size:0.82rem;font-weight:600;transition:all 0.2s;font-family:var(--font-body)}
    .pomo-btn.primary{background:var(--accent);color:#fff}
    .pomo-btn.primary:hover{filter:brightness(1.1)}
    .pomo-btn.secondary{background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)}
    .pomo-btn.secondary:hover{border-color:var(--text-tertiary)}
    .pomo-sessions{font-size:0.75rem;color:var(--text-tertiary)}
    .stats-card{background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:10px}
    .stats-card h4{font-size:0.78rem;color:var(--text-tertiary);margin-bottom:8px;font-weight:500}
    .stats-value{font-size:1.6rem;font-weight:700;color:var(--text-primary)}
    .stats-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:768px){.planner-modal{max-width:98vw;max-height:92vh;border-radius:14px}.planner-add-row{flex-wrap:wrap}}
    `;
    document.head.appendChild(style);

    let overlayEl = null;

    function init() {
        tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
        sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
        createOverlay();
        console.log('[Planner] Initialized');
    }

    function createOverlay() {
        overlayEl = document.createElement('div');
        overlayEl.className = 'planner-overlay';
        overlayEl.innerHTML = `
        <div class="planner-modal">
            <div class="planner-header">
                <h2>📅 Study Planner</h2>
                <button class="planner-close">✕</button>
            </div>
            <div class="planner-tabs">
                <button class="planner-tab active" data-tab="tasks">📋 Tasks</button>
                <button class="planner-tab" data-tab="timer">⏱️ Pomodoro</button>
                <button class="planner-tab" data-tab="stats">📊 Stats</button>
            </div>
            <div class="planner-body"></div>
        </div>`;
        overlayEl.querySelector('.planner-close').addEventListener('click', close);
        overlayEl.addEventListener('click', e => { if (e.target === overlayEl) close(); });
        overlayEl.querySelectorAll('.planner-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
        document.body.appendChild(overlayEl);
    }

    function switchTab(tab) {
        currentTab = tab;
        overlayEl.querySelectorAll('.planner-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
        renderBody();
    }

    function renderBody() {
        const body = overlayEl.querySelector('.planner-body');
        if (currentTab === 'tasks') renderTasks(body);
        else if (currentTab === 'timer') renderTimer(body);
        else renderStats(body);
    }

    function renderTasks(body) {
        const sorted = [...tasks].sort((a,b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            const p = {high:0,medium:1,low:2};
            return (p[a.priority]||1) - (p[b.priority]||1);
        });
        body.innerHTML = `
            <div class="planner-add-row">
                <input type="text" id="plan-task-input" placeholder="Add a study task..." />
                <select id="plan-pri-select"><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select>
                <button class="planner-add-btn" id="plan-add-btn">+ Add</button>
            </div>
            ${sorted.length ? sorted.map((t,i) => `
                <div class="planner-task${t.done?' done':''}">
                    <input type="checkbox" ${t.done?'checked':''} data-idx="${tasks.indexOf(t)}"/>
                    <span class="planner-task-title">${escHtml(t.title)}</span>
                    <span class="planner-task-pri ${t.priority}">${t.priority}</span>
                    <button class="planner-task-del" data-idx="${tasks.indexOf(t)}">🗑</button>
                </div>
            `).join('') : '<div class="planner-empty">No tasks yet. Add one above! ✨</div>'}
        `;
        body.querySelector('#plan-add-btn')?.addEventListener('click', addTask);
        body.querySelector('#plan-task-input')?.addEventListener('keydown', e => { if(e.key==='Enter') addTask(); });
        body.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', e => toggleTask(+e.target.dataset.idx)));
        body.querySelectorAll('.planner-task-del').forEach(b => b.addEventListener('click', e => deleteTask(+e.target.dataset.idx)));
    }

    function addTask() {
        const input = document.getElementById('plan-task-input');
        const pri = document.getElementById('plan-pri-select');
        const title = input?.value.trim();
        if (!title) return;
        tasks.push({ title, priority: pri?.value || 'medium', done: false, createdAt: Date.now() });
        saveTasks(); input.value = ''; renderBody();
        if (typeof Toast !== 'undefined') Toast.show('✅ Task added', 'success');
    }

    function toggleTask(idx) { if (tasks[idx]) { tasks[idx].done = !tasks[idx].done; saveTasks(); renderBody(); } }
    function deleteTask(idx) { tasks.splice(idx, 1); saveTasks(); renderBody(); }
    function saveTasks() { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }

    function renderTimer(body) {
        const circumference = 2 * Math.PI * 82;
        const totalTime = mode === 'focus' ? 25*60 : mode === 'break' ? 5*60 : 15*60;
        const progress = timeLeft / totalTime;
        const offset = circumference * (1 - progress);
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        const modeLabels = { focus: '🎯 Focus Time', break: '☕ Short Break', longbreak: '🌴 Long Break' };

        body.innerHTML = `
        <div class="pomo-container">
            <div class="pomo-ring">
                <svg viewBox="0 0 180 180"><circle class="bg" cx="90" cy="90" r="82"/><circle class="fg" cx="90" cy="90" r="82" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg>
                <div class="pomo-time">
                    <div class="pomo-time-display">${mins}:${secs}</div>
                    <div class="pomo-mode-label">${modeLabels[mode]}</div>
                </div>
            </div>
            <div class="pomo-controls">
                <button class="pomo-btn primary" id="pomo-toggle">${isRunning ? '⏸ Pause' : '▶ Start'}</button>
                <button class="pomo-btn secondary" id="pomo-reset">↺ Reset</button>
            </div>
            <div class="pomo-sessions">Sessions today: ${pomodoroCount} 🍅</div>
        </div>`;
        body.querySelector('#pomo-toggle')?.addEventListener('click', toggleTimer);
        body.querySelector('#pomo-reset')?.addEventListener('click', resetTimer);
    }

    function toggleTimer() {
        if (isRunning) { clearInterval(timerInterval); timerInterval = null; isRunning = false; }
        else {
            isRunning = true;
            timerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) { completeSession(); return; }
                if (currentTab === 'timer') renderBody();
            }, 1000);
        }
        if (currentTab === 'timer') renderBody();
    }

    function resetTimer() {
        clearInterval(timerInterval); timerInterval = null; isRunning = false;
        mode = 'focus'; timeLeft = 25*60;
        if (currentTab === 'timer') renderBody();
    }

    function completeSession() {
        clearInterval(timerInterval); timerInterval = null; isRunning = false;
        // Play beep
        try { const ctx = new AudioContext(), osc = ctx.createOscillator(), g = ctx.createGain(); osc.connect(g); g.connect(ctx.destination); osc.frequency.value = 880; g.gain.value = 0.3; osc.start(); osc.stop(ctx.currentTime + 0.3); } catch {}
        if (mode === 'focus') {
            pomodoroCount++;
            sessions.push({ date: new Date().toISOString().split('T')[0], duration: 25, completedAt: Date.now() });
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
            if (typeof Toast !== 'undefined') Toast.show(`🍅 Pomodoro #${pomodoroCount} complete!`, 'xp');
            mode = pomodoroCount % 4 === 0 ? 'longbreak' : 'break';
            timeLeft = mode === 'longbreak' ? 15*60 : 5*60;
        } else {
            mode = 'focus'; timeLeft = 25*60;
            if (typeof Toast !== 'undefined') Toast.show('Break over! Time to focus 🎯', 'info');
        }
        if (currentTab === 'timer') renderBody();
    }

    function renderStats(body) {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = sessions.filter(s => s.date === today);
        const weekAgo = Date.now() - 7*86400000;
        const weekSessions = sessions.filter(s => s.completedAt > weekAgo);
        const totalMins = todaySessions.reduce((a,s) => a + s.duration, 0);
        const weekMins = weekSessions.reduce((a,s) => a + s.duration, 0);

        body.innerHTML = `
        <div class="stats-row">
            <div class="stats-card"><h4>Today</h4><div class="stats-value">${totalMins}<span style="font-size:0.7rem;color:var(--text-tertiary)"> min</span></div></div>
            <div class="stats-card"><h4>This Week</h4><div class="stats-value">${weekMins}<span style="font-size:0.7rem;color:var(--text-tertiary)"> min</span></div></div>
        </div>
        <div class="stats-row">
            <div class="stats-card"><h4>Sessions Today</h4><div class="stats-value">${todaySessions.length} 🍅</div></div>
            <div class="stats-card"><h4>Total All-Time</h4><div class="stats-value">${sessions.length} 🍅</div></div>
        </div>
        <div class="stats-card"><h4>Tasks</h4><div class="stats-value">${tasks.filter(t=>t.done).length}<span style="font-size:0.8rem;color:var(--text-tertiary)">/${tasks.length} completed</span></div></div>`;
    }

    function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function open() { overlayEl?.classList.add('active'); renderBody(); }
    function close() { overlayEl?.classList.remove('active'); }

    return { init, open, close };
})();
