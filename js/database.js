/* NEXUS v3.0 — Firestore Database Module */
const DB = (() => {
    function uid() { return auth.currentUser?.uid; }

    // ---- User Profile ----
    async function saveUserProfile(data) {
        if (!uid()) return;
        await db.collection('users').doc(uid()).set(data, { merge: true });
    }

    async function loadUserProfile() {
        if (!uid()) return null;
        const doc = await db.collection('users').doc(uid()).get();
        return doc.exists ? doc.data() : null;
    }

    async function updateXP(amount, reason) {
        if (!uid()) return;
        const ref = db.collection('users').doc(uid());
        await ref.update({
            xp: firebase.firestore.FieldValue.increment(amount)
        });
        // Log the XP activity
        await ref.collection('xpLog').add({
            xp: amount,
            reason,
            time: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async function getXP() {
        const profile = await loadUserProfile();
        return profile?.xp || 0;
    }

    async function getXPLog(limit = 20) {
        if (!uid()) return [];
        const snap = await db.collection('users').doc(uid())
            .collection('xpLog')
            .orderBy('time', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }

    // ---- Chat History ----
    async function saveChat(chatId, data) {
        if (!uid()) return;
        await db.collection('users').doc(uid())
            .collection('chats').doc(chatId)
            .set({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
    }

    async function loadChats() {
        if (!uid()) return {};
        const snap = await db.collection('users').doc(uid())
            .collection('chats')
            .orderBy('updatedAt', 'desc')
            .limit(50)
            .get();
        const chats = {};
        snap.docs.forEach(d => { chats[d.id] = { id: d.id, ...d.data() }; });
        return chats;
    }

    async function deleteChat(chatId) {
        if (!uid()) return;
        await db.collection('users').doc(uid())
            .collection('chats').doc(chatId).delete();
    }

    async function clearAllChats() {
        if (!uid()) return;
        const snap = await db.collection('users').doc(uid())
            .collection('chats').get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }

    // ---- Settings ----
    async function saveSettings(settings) {
        if (!uid()) return;
        await db.collection('users').doc(uid()).update({ settings });
    }

    async function loadSettings() {
        const profile = await loadUserProfile();
        return profile?.settings || null;
    }

    // ---- Streak ----
    async function updateStreak() {
        if (!uid()) return 0;
        const profile = await loadUserProfile();
        if (!profile) return 0;
        const today = new Date().toDateString();
        const lastVisit = profile.lastVisit?.toDate?.()?.toDateString?.() || profile.lastVisit || '';
        let newStreak = profile.streak || 0;

        if (lastVisit === today) {
            // Same day, no change
        } else if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
            newStreak += 1; // Consecutive day
        } else {
            newStreak = 1; // Streak broken
        }

        await db.collection('users').doc(uid()).update({
            streak: newStreak,
            lastVisit: firebase.firestore.FieldValue.serverTimestamp()
        });
        return newStreak;
    }

    // ---- Migration: localStorage → Firestore ----
    async function migrateFromLocalStorage() {
        if (!uid()) return;
        const migrated = localStorage.getItem('nexus_migrated_' + uid());
        if (migrated) return;

        // Migrate user profile
        const name = localStorage.getItem('nexus_student_name');
        const level = localStorage.getItem('nexus_level') || 'College Student';
        const interests = JSON.parse(localStorage.getItem('nexus_interests') || '[]');
        const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');

        if (name || xp > 0) {
            await saveUserProfile({
                displayName: name || auth.currentUser.displayName || 'User',
                level, interests, xp, streak
            });
        }

        // Migrate chats
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        for (const [chatId, chatData] of Object.entries(chats)) {
            await saveChat(chatId, chatData);
        }

        // Migrate settings
        const theme = localStorage.getItem('nexus_theme') || 'dark';
        const accent = localStorage.getItem('nexus_accent') || '#4a6cf7';
        const lang = localStorage.getItem('nexus_lang') || 'en';
        const fontSize = localStorage.getItem('nexus_font_size') || 'medium';
        await saveSettings({ theme, accent, lang, fontSize });

        localStorage.setItem('nexus_migrated_' + uid(), '1');
        console.log('✅ Migrated localStorage data to Firestore');
    }

    // ---- Bug Reports ----
    async function submitBugReport(report) {
        await db.collection('bugReports').add({
            ...report,
            userId: uid() || 'anonymous',
            userEmail: auth.currentUser?.email || 'unknown',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    return {
        saveUserProfile, loadUserProfile,
        updateXP, getXP, getXPLog,
        saveChat, loadChats, deleteChat, clearAllChats,
        saveSettings, loadSettings,
        updateStreak, migrateFromLocalStorage,
        submitBugReport
    };
})();
