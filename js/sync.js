/* NEXUS v6.0 — Firestore Sync Engine
   Phase 6: Centralized bidirectional sync layer.
   Syncs XP, XP Log, Missions, Agent State, and Streak to Firestore.
   localStorage acts as fast cache; Firestore is source of truth.
   Includes real-time onSnapshot listeners for cross-device sync.
*/
const Sync = (() => {
    let listeners = [];       // Active Firestore listeners
    let syncEnabled = false;
    let lastSyncTime = 0;
    const DEBOUNCE_MS = 2000; // Debounce writes to avoid Firestore quota

    // ═══════════════════════════════════
    //  INIT — Called once after login
    // ═══════════════════════════════════
    async function init() {
        const uid = auth.currentUser?.uid;
        if (!uid) { console.warn('Sync: No user'); return; }

        syncEnabled = true;
        console.log('🔄 Sync Engine initialized');

        // 1. Pull from Firestore → populate localStorage cache
        await pullAll();

        // 2. Start real-time listeners
        startListeners();

        // 3. Push any local-only data that hasn't been synced
        await pushPending();

        console.log('✅ Sync Engine ready');
    }

    // ═══════════════════════════════════
    //  PULL — Firestore → localStorage
    // ═══════════════════════════════════
    async function pullAll() {
        try {
            await Promise.all([
                pullXP(),
                pullMissions(),
                pullAgentState(),
                pullXPLog(),
            ]);
        } catch (e) {
            console.warn('Sync pull failed:', e);
        }
    }

    async function pullXP() {
        const profile = await DB.loadUserProfile();
        if (!profile) return;
        // Only overwrite if Firestore has newer/higher XP
        const localXP = parseInt(localStorage.getItem('nexus_xp') || '0');
        const remoteXP = profile.xp || 0;
        if (remoteXP >= localXP) {
            localStorage.setItem('nexus_xp', remoteXP.toString());
        }
        // Streak
        const localStreak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const remoteStreak = profile.streak || 0;
        if (remoteStreak >= localStreak) {
            localStorage.setItem('nexus_streak', remoteStreak.toString());
        }
    }

    async function pullXPLog() {
        try {
            const remoteLogs = await DB.getXPLog(50);
            if (!remoteLogs.length) return;

            // Merge remote logs with local logs (dedup by time)
            const local = JSON.parse(localStorage.getItem('nexus_xp_log') || '[]');
            const localTimes = new Set(local.map(l => l.time));
            const merged = [...local];

            remoteLogs.forEach(r => {
                const timeStr = r.time?.toDate?.()?.toLocaleString?.() || r.time || '';
                if (timeStr && !localTimes.has(timeStr)) {
                    merged.push({ xp: r.xp, reason: r.reason, time: timeStr });
                }
            });

            // Sort by time desc, cap at 100
            merged.sort((a, b) => new Date(b.time) - new Date(a.time));
            localStorage.setItem('nexus_xp_log', JSON.stringify(merged.slice(0, 100)));
        } catch (e) {
            console.warn('Sync pullXPLog:', e);
        }
    }

    async function pullMissions() {
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            const doc = await db.collection('users').doc(uid)
                .collection('sync_data').doc('missions').get();
            if (!doc.exists) return;
            const data = doc.data();
            const today = new Date().toDateString();

            // Only use remote data if it's from today
            if (data.date === today && data.missions?.length) {
                localStorage.setItem('nexus_daily_missions', JSON.stringify(data.missions));
                localStorage.setItem('nexus_missions_date', data.date);
            }
        } catch (e) {
            console.warn('Sync pullMissions:', e);
        }
    }

    async function pullAgentState() {
        try {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            const doc = await db.collection('users').doc(uid)
                .collection('sync_data').doc('agent_state').get();
            if (!doc.exists) return;
            const data = doc.data();

            // Merge with local agent state (remote wins on conflict)
            if (data.state) {
                const local = JSON.parse(localStorage.getItem('nexus_agent_state') || '{}');
                const merged = { ...local, ...data.state };
                localStorage.setItem('nexus_agent_state', JSON.stringify(merged));
            }
        } catch (e) {
            console.warn('Sync pullAgentState:', e);
        }
    }

    // ═══════════════════════════════════
    //  PUSH — localStorage → Firestore
    // ═══════════════════════════════════
    async function pushPending() {
        try {
            await Promise.all([
                pushXP(),
                pushMissions(),
                pushAgentState(),
            ]);
            lastSyncTime = Date.now();
        } catch (e) {
            console.warn('Sync push failed:', e);
        }
    }

    async function pushXP() {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        await db.collection('users').doc(uid).set({
            xp, streak,
            lastSync: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    async function pushMissions() {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const missions = JSON.parse(localStorage.getItem('nexus_daily_missions') || '[]');
        const date = localStorage.getItem('nexus_missions_date') || '';
        if (!missions.length) return;

        await db.collection('users').doc(uid)
            .collection('sync_data').doc('missions').set({
                missions, date,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    async function pushAgentState() {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const state = JSON.parse(localStorage.getItem('nexus_agent_state') || '{}');
        if (!Object.keys(state).length) return;

        await db.collection('users').doc(uid)
            .collection('sync_data').doc('agent_state').set({
                state,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    // ═══════════════════════════════════
    //  REAL-TIME LISTENERS (onSnapshot)
    // ═══════════════════════════════════
    function startListeners() {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Listen to user profile (XP, streak)
        const unsubProfile = db.collection('users').doc(uid)
            .onSnapshot((doc) => {
                if (!doc.exists) return;
                const data = doc.data();
                const localXP = parseInt(localStorage.getItem('nexus_xp') || '0');
                if (data.xp && data.xp > localXP) {
                    localStorage.setItem('nexus_xp', data.xp.toString());
                    // Refresh dashboard if visible
                    refreshDashboard();
                }
                if (data.streak) {
                    localStorage.setItem('nexus_streak', data.streak.toString());
                }
            }, (err) => console.warn('Sync profile listener error:', err));

        listeners.push(unsubProfile);

        // Listen to missions
        const unsubMissions = db.collection('users').doc(uid)
            .collection('sync_data').doc('missions')
            .onSnapshot((doc) => {
                if (!doc.exists) return;
                const data = doc.data();
                const today = new Date().toDateString();
                if (data.date === today && data.missions) {
                    localStorage.setItem('nexus_daily_missions', JSON.stringify(data.missions));
                    localStorage.setItem('nexus_missions_date', data.date);
                }
            }, (err) => console.warn('Sync missions listener error:', err));

        listeners.push(unsubMissions);

        // Listen to agent state
        const unsubAgent = db.collection('users').doc(uid)
            .collection('sync_data').doc('agent_state')
            .onSnapshot((doc) => {
                if (!doc.exists) return;
                const data = doc.data();
                if (data.state) {
                    localStorage.setItem('nexus_agent_state', JSON.stringify(data.state));
                }
            }, (err) => console.warn('Sync agent listener error:', err));

        listeners.push(unsubAgent);

        console.log('📡 Real-time listeners active (3 channels)');
    }

    // ═══════════════════════════════════
    //  DEBOUNCED SYNC (called on changes)
    // ═══════════════════════════════════
    let syncTimer = null;

    function scheduleSync() {
        if (!syncEnabled) return;
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
            pushPending().catch(e => console.warn('Scheduled sync failed:', e));
        }, DEBOUNCE_MS);
    }

    // Called by other modules when they change data
    function onXPChange() { scheduleSync(); }
    function onMissionChange() { scheduleSync(); }
    function onAgentStateChange() { scheduleSync(); }

    // ═══════════════════════════════════
    //  FORCE SYNC (manual trigger)
    // ═══════════════════════════════════
    async function forceSync() {
        if (!syncEnabled) return;
        console.log('⚡ Force sync triggered');
        await pushPending();
        await pullAll();
        refreshDashboard();
        if (typeof Toast !== 'undefined') Toast.show('✅ Synced!', 'success', 2000);
    }

    // ═══════════════════════════════════
    //  DASHBOARD REFRESH HELPER
    // ═══════════════════════════════════
    function refreshDashboard() {
        const panel = document.getElementById('panel-dashboard');
        if (panel?.classList.contains('active')) {
            const body = panel.querySelector('.feature-body');
            if (body && typeof Dashboard !== 'undefined') {
                Dashboard.render(body);
            }
        }
    }

    // ═══════════════════════════════════
    //  CLEANUP (on logout)
    // ═══════════════════════════════════
    function destroy() {
        syncEnabled = false;
        listeners.forEach(unsub => {
            try { unsub(); } catch (e) { /* noop */ }
        });
        listeners = [];
        if (syncTimer) clearTimeout(syncTimer);
        console.log('🛑 Sync Engine destroyed');
    }

    // ═══════════════════════════════════
    //  STATUS
    // ═══════════════════════════════════
    function getStatus() {
        return {
            enabled: syncEnabled,
            listeners: listeners.length,
            lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never',
        };
    }

    return {
        init, destroy,
        pullAll, pushPending, forceSync,
        onXPChange, onMissionChange, onAgentStateChange,
        scheduleSync, getStatus
    };
})();
