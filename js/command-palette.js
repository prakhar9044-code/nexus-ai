/* ============================================================
   CommandPalette – VS Code-style command launcher (Ctrl+K)
   Nexus AI · Premium Study Assistant
   ============================================================ */
const CommandPalette = (() => {
  let overlay, input, list, visible = false, sel = 0, filtered = [], commands = [];
  const RECENT_KEY = 'nexus_recent_commands', MAX_RECENT = 5;

  // ── Styles ──────────────────────────────────────────────────
  const css = `
    .cp-overlay{position:fixed;inset:0;z-index:9800;background:rgba(0,0,0,.55);
      backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;
      justify-content:center;padding-top:min(18vh,140px);opacity:0;
      transition:opacity var(--transition-fast,.15s);pointer-events:none}
    .cp-overlay.open{opacity:1;pointer-events:all}
    .cp-box{width:min(540px,92vw);max-height:420px;background:var(--bg-secondary,#1e1e2e);
      border:1px solid var(--border,#333);border-radius:var(--radius-lg,16px);
      box-shadow:var(--shadow-lg,0 24px 48px rgba(0,0,0,.45));display:flex;
      flex-direction:column;overflow:hidden;transform:scale(.92);
      transition:transform var(--transition-fast,.15s)}
    .cp-overlay.open .cp-box{transform:scale(1)}
    .cp-search{display:flex;align-items:center;gap:10px;padding:14px 18px;
      border-bottom:1px solid var(--border-light,#2a2a3a)}
    .cp-search svg{width:18px;height:18px;flex-shrink:0;color:var(--text-tertiary,#888)}
    .cp-search input{flex:1;background:none;border:none;outline:none;
      font:15px/1.4 var(--font-body,sans-serif);color:var(--text-primary,#eee);caret-color:var(--accent,#7c5cfc)}
    .cp-search input::placeholder{color:var(--text-tertiary,#666)}
    .cp-list{flex:1;overflow-y:auto;padding:6px}
    .cp-list::-webkit-scrollbar{width:4px}
    .cp-list::-webkit-scrollbar-thumb{background:var(--border,#333);border-radius:4px}
    .cp-section{padding:4px 14px 2px;font:600 11px/1 var(--font-body,sans-serif);
      text-transform:uppercase;letter-spacing:.8px;color:var(--text-tertiary,#666)}
    .cp-item{display:flex;align-items:center;gap:10px;padding:9px 14px;
      border-radius:var(--radius-sm,8px);cursor:pointer;
      transition:background var(--transition-fast,.12s)}
    .cp-item:hover,.cp-item.active{background:var(--bg-hover,#2a2a40)}
    .cp-item .cp-icon{width:18px;height:18px;display:flex;align-items:center;
      justify-content:center;color:var(--accent,#7c5cfc);font-size:15px;flex-shrink:0}
    .cp-item .cp-label{flex:1;font:14px/1.3 var(--font-body,sans-serif);color:var(--text-primary,#eee)}
    .cp-item .cp-label mark{background:none;color:var(--accent,#7c5cfc);font-weight:700}
    .cp-item .cp-kbd{font:11px/1 var(--font-mono,monospace);color:var(--text-tertiary,#666);
      background:var(--bg-tertiary,#191927);padding:3px 7px;border-radius:var(--radius-sm,6px);
      border:1px solid var(--border-light,#2a2a3a)}
    .cp-empty{padding:28px;text-align:center;color:var(--text-tertiary,#666);font-size:14px}
    @media(max-width:768px){.cp-box{max-height:65vh;width:96vw}
      .cp-search{padding:12px 14px}.cp-item{padding:10px 12px}}`;

  // ── Built-in Commands (30+) ─────────────────────────────────
  const builtIn = [
    // Navigation
    { id:'new-chat',     label:'New Chat',         icon:'💬', shortcut:'Ctrl+N',  cat:'Navigation', action:()=>fire('nexus:newChat')},
    { id:'settings',     label:'Settings',         icon:'⚙️', shortcut:'Ctrl+,',  cat:'Navigation', action:()=>fire('nexus:openSettings')},
    { id:'analytics',    label:'Analytics',        icon:'📊', shortcut:null,      cat:'Navigation', action:()=>fire('nexus:openAnalytics')},
    { id:'flashcards',   label:'Flashcards',       icon:'🃏', shortcut:null,      cat:'Navigation', action:()=>fire('nexus:openFlashcards')},
    { id:'notes',        label:'Notes',            icon:'📝', shortcut:null,      cat:'Navigation', action:()=>fire('nexus:openNotes')},
    { id:'planner',      label:'Study Planner',    icon:'📅', shortcut:null,      cat:'Navigation', action:()=>fire('nexus:openPlanner')},
    { id:'library',      label:'Resource Library',icon:'📚', shortcut:null,      cat:'Navigation', action:()=>fire('nexus:openLibrary')},
    // AI Personas
    { id:'ai-scholar',   label:'Switch to Scholar',  icon:'🎓', cat:'AI Persona', action:()=>fire('nexus:persona','scholar')},
    { id:'ai-coach',     label:'Switch to Coach',    icon:'🏋️', cat:'AI Persona', action:()=>fire('nexus:persona','coach')},
    { id:'ai-buddy',     label:'Switch to Buddy',    icon:'🤝', cat:'AI Persona', action:()=>fire('nexus:persona','buddy')},
    { id:'ai-engineer',  label:'Switch to Engineer', icon:'🔧', cat:'AI Persona', action:()=>fire('nexus:persona','engineer')},
    { id:'ai-creative',  label:'Switch to Creative', icon:'🎨', cat:'AI Persona', action:()=>fire('nexus:persona','creative')},
    { id:'ai-tutor',     label:'Switch to Tutor',    icon:'📖', cat:'AI Persona', action:()=>fire('nexus:persona','tutor')},
    // Theme
    { id:'dark-mode',    label:'Toggle Dark Mode',    icon:'🌙', shortcut:null, cat:'Theme', action:()=>fire('nexus:toggleDark')},
    { id:'theme-gallery',label:'Open Theme Gallery',  icon:'🎭', shortcut:null, cat:'Theme', action:()=>fire('nexus:themeGallery')},
    { id:'compact-mode', label:'Toggle Compact Mode', icon:'🔲', shortcut:null, cat:'Theme', action:()=>fire('nexus:compactMode')},
    // Tools
    { id:'search-msgs',  label:'Search Messages',  icon:'🔍', shortcut:'Ctrl+F', cat:'Tools', action:()=>fire('nexus:searchMessages')},
    { id:'export-chat',  label:'Export Chat',       icon:'📤', shortcut:null,     cat:'Tools', action:()=>fire('nexus:exportChat')},
    { id:'focus-timer',  label:'Focus Timer',       icon:'⏱️', shortcut:null,     cat:'Tools', action:()=>fire('nexus:focusTimer')},
    { id:'smart-recap',  label:'Smart Recap',       icon:'✨', shortcut:null,     cat:'Tools', action:()=>fire('nexus:smartRecap')},
    { id:'pomodoro',     label:'Pomodoro Session',  icon:'🍅', shortcut:null,     cat:'Tools', action:()=>fire('nexus:pomodoro')},
    { id:'quiz-gen',     label:'Generate Quiz',     icon:'❓', shortcut:null,     cat:'Tools', action:()=>fire('nexus:generateQuiz')},
    { id:'summarize',    label:'Summarize Chat',    icon:'📋', shortcut:null,     cat:'Tools', action:()=>fire('nexus:summarize')},
    { id:'bookmark',     label:'Bookmark Message',  icon:'🔖', shortcut:'Ctrl+D', cat:'Tools', action:()=>fire('nexus:bookmark')},
    { id:'upload-file',  label:'Upload File',       icon:'📎', shortcut:null,     cat:'Tools', action:()=>fire('nexus:uploadFile')},
    { id:'voice-input',  label:'Voice Input',       icon:'🎙️', shortcut:null,     cat:'Tools', action:()=>fire('nexus:voiceInput')},
    // System
    { id:'clear-chat',   label:'Clear Chat',       icon:'🗑️', shortcut:null, cat:'System', action:()=>fire('nexus:clearChat')},
    { id:'clear-data',   label:'Clear All Data',   icon:'⚠️', shortcut:null, cat:'System', action:()=>fire('nexus:clearData')},
    { id:'kbd-shortcuts',label:'Keyboard Shortcuts',icon:'⌨️', shortcut:'?',  cat:'System', action:()=>fire('nexus:kbdShortcuts')},
    { id:'fullscreen',   label:'Toggle Fullscreen',icon:'🖥️', shortcut:'F11',cat:'System', action:()=>fire('nexus:fullscreen')},
    { id:'about',        label:'About Nexus AI',   icon:'ℹ️', shortcut:null, cat:'System', action:()=>fire('nexus:about')},
  ];

  const fire = (evt, detail) => document.dispatchEvent(new CustomEvent(evt, { detail }));
  const toast = (m) => typeof Toast !== 'undefined' ? Toast.show(m, 'info') : null;

  // ── Fuzzy Search with Scoring ───────────────────────────────
  function fuzzyMatch(query, text) {
    const q = query.toLowerCase(), t = text.toLowerCase();
    if (!q) return { score: 0, indices: [] };
    if (t === q) return { score: 3, indices: [...Array(t.length).keys()] };
    if (t.startsWith(q)) return { score: 2, indices: [...Array(q.length).keys()] };
    const indices = []; let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) { indices.push(i); qi++; }
    }
    return qi === q.length ? { score: 1, indices } : { score: 0, indices: [] };
  }

  function highlight(text, indices) {
    if (!indices.length) return text;
    const s = new Set(indices);
    return [...text].map((c, i) => s.has(i) ? `<mark>${c}</mark>` : c).join('');
  }

  // ── Recent Commands ─────────────────────────────────────────
  const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } };
  const pushRecent = (id) => {
    let r = getRecent().filter(x => x !== id);
    r.unshift(id); if (r.length > MAX_RECENT) r.length = MAX_RECENT;
    localStorage.setItem(RECENT_KEY, JSON.stringify(r));
  };

  // ── Render ──────────────────────────────────────────────────
  function render(query) {
    list.innerHTML = ''; sel = 0;
    if (!query) {
      const rIds = getRecent(), recent = rIds.map(id => commands.find(c => c.id === id)).filter(Boolean);
      if (recent.length) {
        list.insertAdjacentHTML('beforeend', '<div class="cp-section">Recent</div>');
        recent.forEach(c => list.appendChild(makeItem(c, c.label)));
      }
      list.insertAdjacentHTML('beforeend', '<div class="cp-section">All Commands</div>');
      commands.forEach(c => list.appendChild(makeItem(c, c.label)));
    } else {
      filtered = commands.map(c => ({ ...c, ...fuzzyMatch(query, c.label) }))
        .filter(c => c.score > 0).sort((a, b) => b.score - a.score);
      if (!filtered.length) { list.innerHTML = '<div class="cp-empty">No matching commands</div>'; return; }
      filtered.forEach(c => list.appendChild(makeItem(c, highlight(c.label, c.indices))));
    }
    filtered = [...list.querySelectorAll('.cp-item')];
    if (filtered[0]) filtered[0].classList.add('active');
  }

  function makeItem(cmd, html) {
    const el = document.createElement('div');
    el.className = 'cp-item'; el.dataset.id = cmd.id;
    el.innerHTML = `<span class="cp-icon">${cmd.icon||'⚡'}</span><span class="cp-label">${html}</span>` +
      (cmd.shortcut ? `<span class="cp-kbd">${cmd.shortcut}</span>` : '');
    el.addEventListener('click', () => execute(cmd.id));
    return el;
  }

  // ── Execute ─────────────────────────────────────────────────
  function execute(id) {
    const cmd = commands.find(c => c.id === id);
    if (!cmd) return;
    close(); pushRecent(id);
    try { cmd.action(); toast(`▸ ${cmd.label}`); } catch (e) { console.error('[CP]', e); }
  }

  // ── Keyboard Navigation ─────────────────────────────────────
  function onKey(e) {
    const items = list.querySelectorAll('.cp-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[sel]?.classList.remove('active');
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[sel]?.classList.add('active');
      items[sel]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const id = items[sel]?.dataset.id;
      if (id) execute(id);
    }
  }

  // ── Public API ──────────────────────────────────────────────
  function open() {
    if (visible) return;
    visible = true; input.value = ''; render('');
    requestAnimationFrame(() => overlay.classList.add('open'));
    input.focus();
  }

  function close() {
    if (!visible) return;
    visible = false; overlay.classList.remove('open');
  }

  function registerCommand(cmd) {
    if (commands.find(c => c.id === cmd.id)) return;
    commands.push(cmd);
  }

  function init() {
    // Inject CSS
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);

    // Build DOM
    overlay = document.createElement('div'); overlay.className = 'cp-overlay';
    overlay.innerHTML = `<div class="cp-box"><div class="cp-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="Type a command…" spellcheck="false"/></div>
      <div class="cp-list"></div></div>`;
    document.body.appendChild(overlay);

    input = overlay.querySelector('input');
    list  = overlay.querySelector('.cp-list');

    // Register built-ins
    commands = [...builtIn];

    // Events
    input.addEventListener('input', () => { sel = 0; render(input.value.trim()); });
    input.addEventListener('keydown', onKey);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); visible ? close() : open(); }
      if (e.key === 'Escape' && visible) close();
    });

    console.log('[CommandPalette] ready · Ctrl+K');
  }

  return { init, open, close, registerCommand };
})();
