/* ============================================
   NEXUS — Voice System (Speech Recognition & Synthesis)
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

    // ---- Speech Recognition (Input) ----
    function initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported');
            return false;
        }

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

            if (interimTranscript && onTranscript) {
                onTranscript(interimTranscript);
            }
            if (finalTranscript && onFinalTranscript) {
                onFinalTranscript(finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                Toast.show('🎤 Microphone access denied. Please allow microphone access.', 'error');
            } else if (event.error === 'no-speech') {
                Toast.show('🎤 No speech detected. Try again.', 'info');
            }
            stopListening();
        };

        recognition.onend = () => {
            if (isListening) {
                stopListening();
            }
        };

        return true;
    }

    function startListening() {
        if (!recognition && !initRecognition()) {
            Toast.show('🎤 Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
            return;
        }

        try {
            // Update language setting
            recognition.lang = localStorage.getItem('nexus_voice_lang') || 'en-US';
            recognition.start();
            isListening = true;
            if (onListeningChange) onListeningChange(true);
        } catch (e) {
            console.error('Failed to start recognition:', e);
            if (e.message?.includes('already started')) {
                recognition.stop();
                setTimeout(() => startListening(), 200);
            }
        }
    }

    function stopListening() {
        if (recognition && isListening) {
            try { recognition.stop(); } catch (e) { /* ignore */ }
        }
        isListening = false;
        if (onListeningChange) onListeningChange(false);
    }

    function toggleListening() {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }

    function isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    // ---- Speech Synthesis (Output) ----
    function getVoices() {
        return new Promise(resolve => {
            let voices = synthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
                return;
            }
            synthesis.onvoiceschanged = () => {
                voices = synthesis.getVoices();
                resolve(voices);
            };
            // Fallback timeout
            setTimeout(() => resolve(synthesis.getVoices()), 500);
        });
    }

    async function speak(text) {
        if (!synthesis) return;
        
        const autoSpeak = localStorage.getItem('nexus_auto_speak') !== 'false';
        if (!autoSpeak) return;

        // Stop any current speech
        stopSpeaking();

        // Clean text for speech (remove markdown)
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

        // Split long text into chunks (some browsers have limits)
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

            // Voice settings
            const voiceName = localStorage.getItem('nexus_voice_name');
            const voices = synthesis.getVoices();
            if (voiceName) {
                const voice = voices.find(v => v.name === voiceName);
                if (voice) utterance.voice = voice;
            } else {
                // Try to pick a good default English voice
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
        if (synthesis) {
            synthesis.cancel();
        }
        isSpeaking = false;
        currentUtterance = null;
        if (onSpeakingChange) onSpeakingChange(false);
    }

    // ---- Event Handlers ----
    function setOnTranscript(fn) { onTranscript = fn; }
    function setOnFinalTranscript(fn) { onFinalTranscript = fn; }
    function setOnListeningChange(fn) { onListeningChange = fn; }
    function setOnSpeakingChange(fn) { onSpeakingChange = fn; }

    return {
        startListening,
        stopListening,
        toggleListening,
        isSupported,
        getVoices,
        speak,
        stopSpeaking,
        setOnTranscript,
        setOnFinalTranscript,
        setOnListeningChange,
        setOnSpeakingChange,
        get isListening() { return isListening; },
        get isSpeaking() { return isSpeaking; }
    };
})();
