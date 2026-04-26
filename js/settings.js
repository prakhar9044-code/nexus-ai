/* NEXUS v2.0 — Settings */
const Settings = (() => {
    const colors = [
        {n:'Blue',v:'#4a6cf7'},{n:'Indigo',v:'#6366f1'},{n:'Teal',v:'#0d9488'},
        {n:'Slate',v:'#475569'},{n:'Rose',v:'#e11d48'},{n:'Amber',v:'#d97706'},
        {n:'Emerald',v:'#059669'},{n:'Violet',v:'#7c3aed'}
    ];

    function init() { load(); listen(); renderColors(); applyTheme(); populateVoices(); }
    function open() { document.getElementById('settings-modal').classList.add('active'); }
    function close() { document.getElementById('settings-modal').classList.remove('active'); }

    function listen() {
        document.getElementById('settings-close')?.addEventListener('click', close);
        document.getElementById('settings-modal')?.addEventListener('click', e => { if(e.target.id==='settings-modal')close(); });
        document.getElementById('theme-toggle')?.addEventListener('change', e => { localStorage.setItem('nexus_theme', e.target.checked?'dark':'light'); applyTheme(); });
        document.getElementById('font-size-select')?.addEventListener('change', e => { localStorage.setItem('nexus_font_size', e.target.value); document.documentElement.dataset.fontSize=e.target.value; });
        document.getElementById('student-name-input')?.addEventListener('change', e => { localStorage.setItem('nexus_student_name', e.target.value.trim()); updateWelcomeName(); });
        document.getElementById('api-key-input')?.addEventListener('change', e => { const key = e.target.value.trim(); localStorage.setItem('nexus_api_key', key); Toast.show(key ? '🔑 API key saved!' : '⚠️ API key removed', key ? 'success' : 'info'); });
        document.getElementById('auto-speak-toggle')?.addEventListener('change', e => localStorage.setItem('nexus_auto_speak', e.target.checked.toString()));
        document.getElementById('voice-select')?.addEventListener('change', e => localStorage.setItem('nexus_voice_name', e.target.value));
        document.getElementById('voice-rate')?.addEventListener('input', e => { localStorage.setItem('nexus_voice_rate', e.target.value); document.getElementById('rate-value').textContent=e.target.value+'x'; });
        document.getElementById('voice-pitch')?.addEventListener('input', e => { localStorage.setItem('nexus_voice_pitch', e.target.value); document.getElementById('pitch-value').textContent=e.target.value; });
        document.getElementById('voice-lang')?.addEventListener('change', e => localStorage.setItem('nexus_voice_lang', e.target.value));
        document.getElementById('lang-select')?.addEventListener('change', e => { localStorage.setItem('nexus_lang', e.target.value); Toast.show(e.target.value==='hi'?'भाषा हिंदी में बदली गई':'Language set to English','success'); });
        document.getElementById('compact-toggle')?.addEventListener('change', e => { localStorage.setItem('nexus_compact', e.target.checked.toString()); document.body.classList.toggle('compact-mode', e.target.checked); });
        document.getElementById('timestamps-toggle')?.addEventListener('change', e => { localStorage.setItem('nexus_timestamps', e.target.checked.toString()); document.body.classList.toggle('hide-timestamps', !e.target.checked); });
        document.getElementById('user-level-select')?.addEventListener('change', e => { localStorage.setItem('nexus_user_level', e.target.value); const labels = {kid:'🧒 Kid mode',highschool:'🎓 High School',college:'🏫 College',professional:'💼 Professional'}; Toast.show('Level: ' + (labels[e.target.value]||e.target.value), 'success'); });
        document.getElementById('clear-history-btn')?.addEventListener('click', () => { if(confirm('Clear all chat history?')){Chat.clearAllChats();Toast.show('History cleared','info');close();} });
        document.getElementById('export-chat-btn')?.addEventListener('click', () => Chat.exportChat());
    }

    function load() {
        const isDark = localStorage.getItem('nexus_theme')==='dark';
        const el = id => document.getElementById(id);
        if(el('theme-toggle')) el('theme-toggle').checked = isDark;
        if(el('font-size-select')) el('font-size-select').value = localStorage.getItem('nexus_font_size')||'medium';
        document.documentElement.dataset.fontSize = localStorage.getItem('nexus_font_size')||'medium';
        if(el('student-name-input')) el('student-name-input').value = localStorage.getItem('nexus_student_name')||'';
        if(el('auto-speak-toggle')) el('auto-speak-toggle').checked = localStorage.getItem('nexus_auto_speak')!=='false';
        if(el('voice-rate')) { el('voice-rate').value = localStorage.getItem('nexus_voice_rate')||'1'; document.getElementById('rate-value').textContent=(localStorage.getItem('nexus_voice_rate')||'1')+'x'; }
        if(el('voice-pitch')) { el('voice-pitch').value = localStorage.getItem('nexus_voice_pitch')||'1'; document.getElementById('pitch-value').textContent=localStorage.getItem('nexus_voice_pitch')||'1'; }
        if(el('voice-lang')) el('voice-lang').value = localStorage.getItem('nexus_voice_lang')||'en-US';
        if(el('lang-select')) el('lang-select').value = localStorage.getItem('nexus_lang')||'en';
        if(el('user-level-select')) el('user-level-select').value = localStorage.getItem('nexus_user_level')||'college';
        if(el('compact-toggle')) el('compact-toggle').checked = localStorage.getItem('nexus_compact')==='true';
        document.body.classList.toggle('compact-mode', localStorage.getItem('nexus_compact')==='true');
        if(el('api-key-input')) el('api-key-input').value = localStorage.getItem('nexus_api_key')||'';
        if(el('timestamps-toggle')) el('timestamps-toggle').checked = localStorage.getItem('nexus_timestamps')!=='false';
        document.body.classList.toggle('hide-timestamps', localStorage.getItem('nexus_timestamps')==='false');

        // Auto-open settings if no API key
        if (!localStorage.getItem('nexus_api_key')) {
            setTimeout(() => { open(); Toast.show('🔑 Please add your Gemini API key to get started!', 'info', 5000); }, 1500);
        }
    }

    function applyTheme() {
        document.documentElement.dataset.theme = localStorage.getItem('nexus_theme')||'light';
        const a = localStorage.getItem('nexus_accent')||'#4a6cf7';
        document.documentElement.style.setProperty('--accent', a);
        document.documentElement.style.setProperty('--accent-subtle', a+'14');
        document.documentElement.style.setProperty('--accent-border', a+'33');
        document.documentElement.style.setProperty('--border-focus', a);
    }

    function renderColors() {
        const c = document.getElementById('accent-colors'); if(!c)return;
        const saved = localStorage.getItem('nexus_accent')||'#4a6cf7';
        c.innerHTML = '';
        colors.forEach(col => {
            const b = document.createElement('button');
            b.className = `color-option ${col.v===saved?'active':''}`;
            b.style.background = col.v; b.title = col.n;
            b.addEventListener('click', () => { localStorage.setItem('nexus_accent', col.v); applyTheme(); renderColors(); });
            c.appendChild(b);
        });
    }

    function updateWelcomeName() {
        const n = localStorage.getItem('nexus_student_name');
        const h = document.querySelector('.welcome-screen h2');
        if(h) h.textContent = n ? `Hey ${n}! 👋` : 'Hey there! 👋';
    }

    async function populateVoices() {
        const s = document.getElementById('voice-select'); if(!s)return;
        const v = await Voice.getVoices();
        const saved = localStorage.getItem('nexus_voice_name');
        s.innerHTML = '<option value="">Default</option>';
        v.filter(x=>x.lang.startsWith('en')||x.lang.startsWith('hi')).forEach(x => {
            const o = document.createElement('option');
            o.value=x.name; o.textContent=`${x.name} (${x.lang})`;
            if(x.name===saved)o.selected=true; s.appendChild(o);
        });
    }

    return { init, open, close, applyTheme, updateWelcomeName };
})();
