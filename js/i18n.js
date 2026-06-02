/* NEXUS — Multi-Language (i18n) Support
   Supports: English, Hindi, Spanish, French, German
*/
const I18n = (() => {
    let currentLang = 'en';

    const translations = {
        en: {
            new_chat: 'New Chat', settings: 'Settings', send: 'Send',
            chat_placeholder: 'Ask Nexus anything...', bug_report: 'Bug Report',
            logout: 'Logout', streak: 'day streak', level: 'Level',
            no_chats: 'No conversations yet', welcome: 'Welcome back',
            dark_mode: 'Dark Mode', light_mode: 'Light Mode', language: 'Language',
            share: 'Share', copy_link: 'Copy Link', profile: 'Profile',
            analytics: 'Analytics', missions: 'Missions', close: 'Close',
            cancel: 'Cancel', save: 'Save', delete_chat: 'Delete',
            search: 'Search...', theme: 'Theme', accent_color: 'Accent Color',
            font_size: 'Font Size', api_key: 'API Key', export_data: 'Export Data',
            clear_data: 'Clear All Data', voice_input: 'Voice Input',
            attach_file: 'Attach File', ai_chat: 'AI Chat',
            mock_interview: 'Mock Interview', ai_teacher: 'AI Teacher',
            coding_arena: 'Coding Arena', career_path: 'Career Path',
            resume_builder: 'Resume Builder', skill_analysis: 'Skill Analysis',
            reality_check: 'Reality Check', dashboard: 'Dashboard',
            today: 'Today', yesterday: 'Yesterday', xp: 'XP',
            helpful: 'Helpful', not_helpful: 'Not helpful',
            copy: 'Copy', speak: 'Speak', download: 'Download',
        },
        hi: {
            new_chat: 'नई चैट', settings: 'सेटिंग्स', send: 'भेजें',
            chat_placeholder: 'नेक्सस से कुछ भी पूछें...', bug_report: 'बग रिपोर्ट',
            logout: 'लॉगआउट', streak: 'दिन की स्ट्रीक', level: 'स्तर',
            no_chats: 'अभी कोई बातचीत नहीं', welcome: 'वापस स्वागत है',
            dark_mode: 'डार्क मोड', light_mode: 'लाइट मोड', language: 'भाषा',
            share: 'साझा करें', copy_link: 'लिंक कॉपी करें', profile: 'प्रोफ़ाइल',
            analytics: 'विश्लेषण', missions: 'मिशन', close: 'बंद करें',
            cancel: 'रद्द करें', save: 'सहेजें', delete_chat: 'हटाएं',
            search: 'खोजें...', theme: 'थीम', accent_color: 'एक्सेंट रंग',
            font_size: 'फ़ॉन्ट आकार', api_key: 'API कुंजी', export_data: 'डेटा निर्यात',
            clear_data: 'सभी डेटा साफ़ करें', voice_input: 'आवाज़ इनपुट',
            attach_file: 'फ़ाइल अटैच करें', ai_chat: 'AI चैट',
            mock_interview: 'मॉक इंटरव्यू', ai_teacher: 'AI शिक्षक',
            coding_arena: 'कोडिंग अखाड़ा', career_path: 'करियर पथ',
            resume_builder: 'रिज़्यूमे बिल्डर', skill_analysis: 'कौशल विश्लेषण',
            reality_check: 'रियलिटी चेक', dashboard: 'डैशबोर्ड',
            today: 'आज', yesterday: 'कल', xp: 'XP',
            helpful: 'उपयोगी', not_helpful: 'उपयोगी नहीं',
            copy: 'कॉपी', speak: 'बोलें', download: 'डाउनलोड',
        },
        es: {
            new_chat: 'Nuevo Chat', settings: 'Configuración', send: 'Enviar',
            chat_placeholder: 'Pregunta a Nexus...', bug_report: 'Reportar Error',
            logout: 'Cerrar Sesión', streak: 'días de racha', level: 'Nivel',
            no_chats: 'Sin conversaciones aún', welcome: 'Bienvenido de vuelta',
            dark_mode: 'Modo Oscuro', light_mode: 'Modo Claro', language: 'Idioma',
            share: 'Compartir', copy_link: 'Copiar Enlace', profile: 'Perfil',
            analytics: 'Analíticas', missions: 'Misiones', close: 'Cerrar',
            cancel: 'Cancelar', save: 'Guardar', delete_chat: 'Eliminar',
            search: 'Buscar...', theme: 'Tema', accent_color: 'Color de Acento',
            font_size: 'Tamaño de Fuente', api_key: 'Clave API', export_data: 'Exportar Datos',
            clear_data: 'Borrar Todos los Datos', voice_input: 'Entrada de Voz',
            attach_file: 'Adjuntar Archivo', ai_chat: 'Chat IA',
            mock_interview: 'Entrevista Simulada', ai_teacher: 'Profesor IA',
            coding_arena: 'Arena de Código', career_path: 'Ruta Profesional',
            resume_builder: 'Constructor de CV', skill_analysis: 'Análisis de Habilidades',
            reality_check: 'Verificación de Realidad', dashboard: 'Panel',
            today: 'Hoy', yesterday: 'Ayer', xp: 'XP',
            helpful: 'Útil', not_helpful: 'No útil',
            copy: 'Copiar', speak: 'Hablar', download: 'Descargar',
        },
        fr: {
            new_chat: 'Nouveau Chat', settings: 'Paramètres', send: 'Envoyer',
            chat_placeholder: 'Demandez à Nexus...', bug_report: 'Signaler un Bug',
            logout: 'Déconnexion', streak: 'jours consécutifs', level: 'Niveau',
            no_chats: 'Aucune conversation', welcome: 'Bon retour',
            dark_mode: 'Mode Sombre', light_mode: 'Mode Clair', language: 'Langue',
            share: 'Partager', copy_link: 'Copier le Lien', profile: 'Profil',
            analytics: 'Analytiques', missions: 'Missions', close: 'Fermer',
            cancel: 'Annuler', save: 'Sauvegarder', delete_chat: 'Supprimer',
            search: 'Rechercher...', theme: 'Thème', accent_color: 'Couleur d\'Accent',
            font_size: 'Taille de Police', api_key: 'Clé API', export_data: 'Exporter les Données',
            clear_data: 'Effacer Toutes les Données', voice_input: 'Entrée Vocale',
            attach_file: 'Joindre un Fichier', ai_chat: 'Chat IA',
            mock_interview: 'Entretien Simulé', ai_teacher: 'Professeur IA',
            coding_arena: 'Arène de Code', career_path: 'Parcours de Carrière',
            resume_builder: 'Créateur de CV', skill_analysis: 'Analyse de Compétences',
            reality_check: 'Vérification de Réalité', dashboard: 'Tableau de Bord',
            today: 'Aujourd\'hui', yesterday: 'Hier', xp: 'XP',
            helpful: 'Utile', not_helpful: 'Pas utile',
            copy: 'Copier', speak: 'Parler', download: 'Télécharger',
        },
        de: {
            new_chat: 'Neuer Chat', settings: 'Einstellungen', send: 'Senden',
            chat_placeholder: 'Frag Nexus...', bug_report: 'Fehler Melden',
            logout: 'Abmelden', streak: 'Tage Streak', level: 'Stufe',
            no_chats: 'Noch keine Gespräche', welcome: 'Willkommen zurück',
            dark_mode: 'Dunkelmodus', light_mode: 'Hellmodus', language: 'Sprache',
            share: 'Teilen', copy_link: 'Link Kopieren', profile: 'Profil',
            analytics: 'Analysen', missions: 'Missionen', close: 'Schließen',
            cancel: 'Abbrechen', save: 'Speichern', delete_chat: 'Löschen',
            search: 'Suchen...', theme: 'Design', accent_color: 'Akzentfarbe',
            font_size: 'Schriftgröße', api_key: 'API-Schlüssel', export_data: 'Daten Exportieren',
            clear_data: 'Alle Daten Löschen', voice_input: 'Spracheingabe',
            attach_file: 'Datei Anhängen', ai_chat: 'KI Chat',
            mock_interview: 'Übungsinterview', ai_teacher: 'KI Lehrer',
            coding_arena: 'Code Arena', career_path: 'Karriereweg',
            resume_builder: 'Lebenslauf Builder', skill_analysis: 'Kompetenzanalyse',
            reality_check: 'Realitätscheck', dashboard: 'Dashboard',
            today: 'Heute', yesterday: 'Gestern', xp: 'XP',
            helpful: 'Hilfreich', not_helpful: 'Nicht hilfreich',
            copy: 'Kopieren', speak: 'Sprechen', download: 'Herunterladen',
        }
    };

    function init() {
        currentLang = localStorage.getItem('nexus_lang') || 'en';
        applyTranslations();
        console.log(`[I18n] Language: ${currentLang}`);
    }

    function setLang(code) {
        if (!translations[code]) return;
        currentLang = code;
        localStorage.setItem('nexus_lang', code);
        applyTranslations();
        if (typeof showToast === 'function') {
            const names = { en: 'English', hi: 'हिंदी', es: 'Español', fr: 'Français', de: 'Deutsch' };
            showToast(`Language: ${names[code] || code}`, 'info');
        }
    }

    function t(key) {
        return translations[currentLang]?.[key] || translations.en?.[key] || key;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val) el.textContent = val;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = t(key);
            if (val) el.placeholder = val;
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const val = t(key);
            if (val) el.title = val;
        });
    }

    function getCurrentLang() { return currentLang; }
    function getLanguages() { return [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    ]; }

    return { init, setLang, t, getCurrentLang, getLanguages, applyTranslations };
})();
