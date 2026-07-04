/* ============================================
   NEXUS — Voice System (Speech Recognition & Synthesis)
   Phase 8: Enhanced with mic button UI, speaker on AI msgs,
   pulse animation, floating transcript, keyboard shortcut
   ============================================ */
const Voice = (() => {
    let recognition = null;
    let synthesis = window.speechSynthesis;
    let isListening = false;
    let isSpeaking = false;
    let currentUtterance = null;
    let onTranscript = null;
    let onFinalTranscript = null;
    let onListeningChange = null;
    let onSpeakingChange = null;
    let micBtn = null;
    let transcriptEl = null;

    // Inject styles
    const voiceStyles = document.createElement('style');
    voiceStyles.textContent = `
    .voice-mic-btn{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:8px;border-radius:var(--radius-sm);transition:all 0.2s;display:flex;align-items:center;position:relative}
    .voice-mic-btn:hover{color:var(--accent);background:var(--bg-hover)}
    .voice-mic-btn svg{width:20px;height:20px}
    .voice-mic-btn.recording{color:#ef4444}
    .voice-mic-btn.recording::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:2px solid #ef4444;animation:voice-pulse 1.2s ease-in-out infinite}
    @keyframes voice-pulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.3);opacity:0}}
    .voice-transcript{position:absolute;bottom:100%;left:12px;right:12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:8px 14px;margin-bottom:8px;font-size:0.82rem;color:var(--text-secondary);display:none;animation:voice-transcript-in 0.2s ease;box-shadow:var(--shadow-md)}
    .voice-transcript.active{display:block}
    .voice-transcript::before{content:'🎤 ';font-size:0.9rem}
    @keyframes voice-transcript-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .voice-speak-btn{background:none;border:none;cursor:pointer;font-size:0.85rem;padding:3px 6px;border-radius:6px;transition:all 0.2s;opacity:0.6;color:var(--text-tertiary)}
    .voice-speak-btn:hover{opacity:1;color:var(--accent);background:var(--bg-hover)}
    .voice-speak-btn.speaking{color:var(--accent);opacity:1;background:rgba(74,108,247,0.1)}
    `;
    document.head.appendChild(voiceStyles);

    // ---- Init UI ----
    function init() {
        const inputArea = document.querySelector('.input-area');
        if (!inputArea) return;

        // Use existing mic button from HTML (app.js setupVoice handles click + callbacks)
        if (isSupported()) {
            micBtn = document.getElementById('mic-btn');

            // Floating transcript overlay
            transcriptEl = document.createElement('div');
            transcriptEl.className = 'voice-transcript';
            inputArea.style.position = 'relative';
            inputArea.appendChild(transcriptEl);

            // Note: callbacks (onTranscript, onFinalTranscript, onListeningChange)
            // are set by app.js setupVoice() — do NOT set them here to avoid conflicts

            // Keyboard shortcut (Ctrl+M)
            document.addEventListener('keydown', e => {
                if ((e.ctrlKey && e.key === 'm') || (e.ctrlKey && e.shiftKey && e.key === 'M')) {
                    e.preventDefault();
                    toggleListening();
                }
            });
        }

        // Watch for new AI messages to add speaker buttons
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList?.contains('assistant-message')) {
                        addSpeakButton(node);
                    }
                    if (node.nodeType === 1) {
                        node.querySelectorAll?.('.assistant-message')?.forEach(addSpeakButton);
                    }
                });
            });
        });
        const msgArea = document.querySelector('.messages-area');
        if (msgArea) observer.observe(msgArea, { childList: true, subtree: true });

        // Add buttons to existing AI messages
        document.querySelectorAll('.assistant-message').forEach(addSpeakButton);

        console.log('[Voice] Initialized with UI');
    }

    function addSpeakButton(msgEl) {
        if (msgEl.querySelector('.voice-speak-btn')) return;
        const actions = msgEl.querySelector('.message-actions');
        if (!actions) return;
        const btn = document.createElement('button');
        btn.className = 'voice-speak-btn';
        btn.innerHTML = '🔊';
        btn.title = 'Read aloud';
        btn.addEventListener('click', () => {
            if (btn.classList.contains('speaking')) {
                stopSpeaking();
                btn.classList.remove('speaking');
                return;
            }
            // Remove speaking from other buttons
            document.querySelectorAll('.voice-speak-btn.speaking').forEach(b => b.classList.remove('speaking'));
            btn.classList.add('speaking');
            const text = msgEl.querySelector('.message-content')?.textContent || msgEl.textContent;
            speakText(text).then(() => btn.classList.remove('speaking'));
        });
        actions.appendChild(btn);
    }

    // ---- Speech Recognition (Input) ----
    function initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = localStorage.getItem('nexus_voice_lang') || 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            if (interimTranscript && onTranscript) onTranscript(interimTranscript);
            if (finalTranscript && onFinalTranscript) onFinalTranscript(finalTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            const toast = typeof showToast === 'function' ? showToast : (typeof Toast !== 'undefined' ? Toast.show : null);
            if (event.error === 'not-allowed' && toast) toast('🎤 Microphone access denied', 'error');
            else if (event.error === 'no-speech' && toast) toast('🎤 No speech detected', 'info');
            stopListening();
        };

        recognition.onend = () => { if (isListening) stopListening(); };
        return true;
    }

    function startListening() {
        if (!recognition && !initRecognition()) {
            const toast = typeof showToast === 'function' ? showToast : null;
            if (toast) toast('🎤 Speech not supported. Use Chrome/Edge.', 'error');
            return;
        }
        try {
            recognition.lang = localStorage.getItem('nexus_voice_lang') || 'en-US';
            recognition.start();
            isListening = true;
            if (onListeningChange) onListeningChange(true);
        } catch (e) {
            if (e.message?.includes('already started')) {
                recognition.stop();
                setTimeout(() => startListening(), 200);
            }
        }
    }

    function stopListening() {
        if (recognition && isListening) {
            try { recognition.stop(); } catch {}
        }
        isListening = false;
        if (onListeningChange) onListeningChange(false);
    }

    function toggleListening() {
        if (isListening) stopListening(); else startListening();
    }

    function isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    // ---- Speech Synthesis (Output) ----
    function getVoices() {
        return new Promise(resolve => {
            let voices = synthesis.getVoices();
            if (voices.length > 0) { resolve(voices); return; }
            synthesis.onvoiceschanged = () => resolve(synthesis.getVoices());
            setTimeout(() => resolve(synthesis.getVoices()), 500);
        });
    }

    async function speakText(text) {
        if (!synthesis) return;
        stopSpeaking();

        const cleanText = text
            .replace(/```[\s\S]*?```/g, ' code block ')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/#{1,6}\s/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[|]/g, ' ')
            .replace(/-{3,}/g, '')
            .replace(/\n{2,}/g, '. ')
            .replace(/\n/g, '. ')
            .trim();
        if (!cleanText) return;

        const chunks = splitTextForSpeech(cleanText);
        isSpeaking = true;
        if (onSpeakingChange) onSpeakingChange(true);
        for (const chunk of chunks) {
            if (!isSpeaking) break;
            await speakChunk(chunk);
        }
        isSpeaking = false;
        if (onSpeakingChange) onSpeakingChange(false);
    }

    // Legacy speak method (checks auto-speak setting)
    async function speak(text) {
        const autoSpeak = localStorage.getItem('nexus_auto_speak') !== 'false';
        if (!autoSpeak) return;
        await speakText(text);
    }

    function splitTextForSpeech(text) {
        const maxLen = 200;
        if (text.length <= maxLen) return [text];
        const chunks = [];
        const sentences = text.split(/(?<=[.!?])\s+/);
        let current = '';
        for (const sentence of sentences) {
            if ((current + ' ' + sentence).length > maxLen && current) {
                chunks.push(current.trim());
                current = sentence;
            } else {
                current += (current ? ' ' : '') + sentence;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks;
    }

    function speakChunk(text) {
        return new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(text);
            currentUtterance = utterance;
            const voiceName = localStorage.getItem('nexus_voice_name');
            const voices = synthesis.getVoices();
            if (voiceName) {
                const voice = voices.find(v => v.name === voiceName);
                if (voice) utterance.voice = voice;
            } else {
                const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
                if (preferred) utterance.voice = preferred;
            }
            utterance.rate = parseFloat(localStorage.getItem('nexus_voice_rate') || '1');
            utterance.pitch = parseFloat(localStorage.getItem('nexus_voice_pitch') || '1');
            utterance.volume = 1;
            utterance.onend = resolve;
            utterance.onerror = resolve;
            synthesis.speak(utterance);
        });
    }

    function stopSpeaking() {
        if (synthesis) synthesis.cancel();
        isSpeaking = false;
        currentUtterance = null;
        if (onSpeakingChange) onSpeakingChange(false);
        document.querySelectorAll('.voice-speak-btn.speaking').forEach(b => b.classList.remove('speaking'));
    }

    // ---- Event Handlers ----
    function setOnTranscript(fn) { onTranscript = fn; }
    function setOnFinalTranscript(fn) { onFinalTranscript = fn; }
    function setOnListeningChange(fn) { onListeningChange = fn; }
    function setOnSpeakingChange(fn) { onSpeakingChange = fn; }

    return {
        init,
        startListening,
        stopListening,
        toggleListening,
        isSupported,
        getVoices,
        speak,
        speakText,
        stopSpeaking,
        setOnTranscript,
        setOnFinalTranscript,
        setOnListeningChange,
        setOnSpeakingChange,
        get isListening() { return isListening; },
        get isSpeaking() { return isSpeaking; }
    };
})();
