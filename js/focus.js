/* NEXUS — Focus Mode / Pomodoro Timer (Phase 11)
   Built-in study timer with Pomodoro technique, XP rewards, ambient dim
*/
const Focus = (() => {
    let initialized = false;
    let timer = null;
    let remaining = 0;
    let totalDuration = 0;
    let isRunning = false;
    let isBreak = false;
    let sessionsToday = parseInt(localStorage.getItem('nexus_focus_sessions') || '0');
    let totalFocusMin = parseInt(localStorage.getItem('nexus_focus_total') || '0');
    const PRESETS = [
        { label: '15 min', work: 15, break: 3 },
        { label: '25 min', work: 25, break: 5 },
        { label: '45 min', work: 45, break: 10 },
        { label: '60 min', work: 60, break: 15 }
    ];
    let selectedPreset = 1; // 25 min default

    const style = document.createElement('style');
    style.textContent = `
    .focus-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .focus-overlay.active{opacity:1;visibility:visible}
    .focus-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;width:min(420px,90vw);padding:32px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .focus-overlay.active .focus-modal{transform:scale(1)}
    .focus-title{font-size:1.3rem;font-weight:700;margin-bottom:4px}
    .focus-subtitle{font-size:0.78rem;color:var(--text-tertiary);margin-bottom:20px}
    .focus-timer-display{font-size:4rem;font-weight:700;font-family:var(--font-mono,'JetBrains Mono',monospace);color:var(--accent);margin:20px 0;letter-spacing:2px;line-height:1}
    .focus-timer-label{font-size:0.75rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}
    .focus-presets{display:flex;gap:6px;justify-content:center;margin-bottom:20px;flex-wrap:wrap}
    .focus-preset{padding:6px 14px;border:1px solid var(--border);border-radius:20px;background:none;color:var(--text-secondary);font-size:0.75rem;font-weight:600;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .focus-preset:hover{border-color:var(--accent);color:var(--accent)}
    .focus-preset.active{background:var(--accent);color:#fff;border-color:var(--accent)}
    .focus-controls{display:flex;gap:10px;justify-content:center;margin-top:20px}
    .focus-btn{padding:10px 28px;border:none;border-radius:14px;font-size:0.88rem;font-weight:700;cursor:pointer;font-family:var(--font-body);transition:all 0.2s}
    .focus-btn-start{background:var(--accent);color:#fff}
    .focus-btn-start:hover{filter:brightness(1.1);transform:translateY(-1px)}
    .focus-btn-pause{background:var(--bg-secondary);color:var(--text-primary);border:1px solid var(--border)}
    .focus-btn-reset{background:none;color:var(--text-tertiary);border:1px solid var(--border)}
    .focus-btn-reset:hover{color:#ef4444;border-color:#ef4444}
    .focus-stats{display:flex;gap:16px;justify-content:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)}
    .focus-stat{text-align:center}
    .focus-stat-value{font-size:1.1rem;font-weight:700;color:var(--accent)}
    .focus-stat-label{font-size:0.65rem;color:var(--text-tertiary);margin-top:2px}
    .focus-progress{width:100%;height:4px;background:var(--bg-tertiary);border-radius:4px;margin-top:8px;overflow:hidden}
    .focus-progress-fill{height:100%;background:var(--accent);border-radius:4px;transition:width 1s linear}
    .focus-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.2rem;color:var(--text-tertiary);cursor:pointer}
    .focus-mini{position:fixed;bottom:20px;right:20px;z-index:9500;background:var(--bg-primary);border:1px solid var(--border);border-radius:16px;padding:10px 16px;box-shadow:0 8px 30px rgba(0,0,0,0.3);display:none;align-items:center;gap:10px;cursor:pointer;transition:all 0.2s}
    .focus-mini.active{display:flex}
    .focus-mini:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,0.4)}
    .focus-mini-time{font-family:var(--font-mono);font-weight:700;font-size:0.9rem;color:var(--accent)}
    .focus-mini-label{font-size:0.7rem;color:var(--text-tertiary)}
    .focus-ambient{pointer-events:none;position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,0.15);opacity:0;transition:opacity 0.5s}
    .focus-ambient.active{opacity:1}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        resetDailyIfNeeded();
        createOverlay();
        createMiniTimer();
        createAmbient();
        console.log('[Focus] Initialized');
    }

    function resetDailyIfNeeded() {
        const lastDay = localStorage.getItem('nexus_focus_day');
        const today = new Date().toDateString();
        if (lastDay !== today) {
            sessionsToday = 0;
            localStorage.setItem('nexus_focus_sessions', '0');
            localStorage.setItem('nexus_focus_day', today);
        }
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'focus-overlay';
        overlay.id = 'focus-overlay';
        overlay.innerHTML = `
            <div class="focus-modal" style="position:relative">
                <button class="focus-close" id="focus-close">✕</button>
                <div class="focus-title">⏱️ Focus Mode</div>
                <div class="focus-subtitle">Pomodoro technique — stay focused, earn XP</div>
                <div class="focus-presets" id="focus-presets">
                    ${PRESETS.map((p, i) => `<button class="focus-preset ${i === selectedPreset ? 'active' : ''}" data-idx="${i}">${p.label}</button>`).join('')}
                </div>
                <div class="focus-timer-label" id="focus-label">WORK SESSION</div>
                <div class="focus-timer-display" id="focus-display">25:00</div>
                <div class="focus-progress"><div class="focus-progress-fill" id="focus-progress" style="width:100%"></div></div>
                <div class="focus-controls" id="focus-controls">
                    <button class="focus-btn focus-btn-start" id="focus-start">▶ Start</button>
                    <button class="focus-btn focus-btn-reset" id="focus-reset">↺ Reset</button>
                </div>
                <div class="focus-stats">
                    <div class="focus-stat"><div class="focus-stat-value" id="focus-sessions">${sessionsToday}</div><div class="focus-stat-label">Sessions Today</div></div>
                    <div class="focus-stat"><div class="focus-stat-value" id="focus-total">${totalFocusMin}</div><div class="focus-stat-label">Total Minutes</div></div>
                    <div class="focus-stat"><div class="focus-stat-value">+10</div><div class="focus-stat-label">XP per Session</div></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('focus-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay && !isRunning) close(); });

        document.getElementById('focus-start').addEventListener('click', toggleTimer);
        document.getElementById('focus-reset').addEventListener('click', resetTimer);

        overlay.querySelectorAll('.focus-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                if (isRunning) return;
                selectedPreset = parseInt(btn.dataset.idx);
                overlay.querySelectorAll('.focus-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                resetTimer();
            });
        });
    }

    function createMiniTimer() {
        const mini = document.createElement('div');
        mini.className = 'focus-mini';
        mini.id = 'focus-mini';
        mini.innerHTML = `<span class="focus-mini-label">⏱️</span><span class="focus-mini-time" id="focus-mini-time">25:00</span>`;
        mini.addEventListener('click', open);
        document.body.appendChild(mini);
    }

    function createAmbient() {
        const ambient = document.createElement('div');
        ambient.className = 'focus-ambient';
        ambient.id = 'focus-ambient';
        document.body.appendChild(ambient);
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function toggleTimer() {
        if (isRunning) pauseTimer();
        else startTimer();
    }

    function startTimer() {
        if (remaining <= 0) {
            const preset = PRESETS[selectedPreset];
            remaining = (isBreak ? preset.break : preset.work) * 60;
            totalDuration = remaining;
        }
        isRunning = true;
        updateStartBtn();
        document.getElementById('focus-mini')?.classList.add('active');
        if (!isBreak) document.getElementById('focus-ambient')?.classList.add('active');

        timer = setInterval(() => {
            remaining--;
            updateDisplay();
            if (remaining <= 0) {
                clearInterval(timer);
                timer = null;
                isRunning = false;
                onTimerComplete();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timer);
        timer = null;
        isRunning = false;
        updateStartBtn();
    }

    function resetTimer() {
        clearInterval(timer);
        timer = null;
        isRunning = false;
        isBreak = false;
        const preset = PRESETS[selectedPreset];
        remaining = preset.work * 60;
        totalDuration = remaining;
        updateDisplay();
        updateStartBtn();
        document.getElementById('focus-label').textContent = 'WORK SESSION';
        document.getElementById('focus-mini')?.classList.remove('active');
        document.getElementById('focus-ambient')?.classList.remove('active');
    }

    function onTimerComplete() {
        if (!isBreak) {
            // Work session completed
            sessionsToday++;
            totalFocusMin += PRESETS[selectedPreset].work;
            localStorage.setItem('nexus_focus_sessions', sessionsToday);
            localStorage.setItem('nexus_focus_total', totalFocusMin);
            document.getElementById('focus-sessions').textContent = sessionsToday;
            document.getElementById('focus-total').textContent = totalFocusMin;

            // Award XP
            if (typeof Engage !== 'undefined' && Engage.addXP) Engage.addXP(10);
            Toast.show('🎉 Focus session complete! +10 XP', 'xp');

            // Switch to break
            isBreak = true;
            const preset = PRESETS[selectedPreset];
            remaining = preset.break * 60;
            totalDuration = remaining;
            document.getElementById('focus-label').textContent = '☕ BREAK TIME';
            updateDisplay();
            document.getElementById('focus-ambient')?.classList.remove('active');
        } else {
            // Break completed
            isBreak = false;
            Toast.show('Break over! Ready for another round? 💪', 'info');
            const preset = PRESETS[selectedPreset];
            remaining = preset.work * 60;
            totalDuration = remaining;
            document.getElementById('focus-label').textContent = 'WORK SESSION';
            updateDisplay();
        }
        updateStartBtn();
        document.getElementById('focus-mini')?.classList.remove('active');
    }

    function updateDisplay() {
        const display = document.getElementById('focus-display');
        const miniTime = document.getElementById('focus-mini-time');
        const progress = document.getElementById('focus-progress');
        const timeStr = formatTime(remaining);
        if (display) display.textContent = timeStr;
        if (miniTime) miniTime.textContent = timeStr;
        if (progress && totalDuration > 0) progress.style.width = ((remaining / totalDuration) * 100) + '%';
    }

    function updateStartBtn() {
        const btn = document.getElementById('focus-start');
        if (!btn) return;
        btn.textContent = isRunning ? '⏸ Pause' : '▶ Start';
        btn.className = isRunning ? 'focus-btn focus-btn-pause' : 'focus-btn focus-btn-start';
    }

    function open() {
        document.getElementById('focus-overlay')?.classList.add('active');
    }

    function close() {
        if (isRunning) {
            document.getElementById('focus-overlay')?.classList.remove('active');
            return; // Keep mini timer visible
        }
        document.getElementById('focus-overlay')?.classList.remove('active');
    }

    return { init, open, close };
})();
