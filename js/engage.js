/* NEXUS v7.0 — Smart Notification & Engagement Engine
   Phase 7: Scheduled reminders, streak protection, mission nudges,
   inactivity re-engagement, smart timing based on user patterns.
   Works with browser Push API + in-app notifications.
*/
const Engage = (() => {
    let timers = [];
    let enabled = false;
    const PREFS_KEY = 'nexus_engage_prefs';

    // ═══════════════════════════════════
    //  DEFAULT PREFERENCES
    // ═══════════════════════════════════
    const DEFAULT_PREFS = {
        studyReminders: true,
        streakAlerts: true,
        missionNudges: true,
        inactivityAlerts: true,
        quietHoursStart: 22,  // 10 PM
        quietHoursEnd: 8,     // 8 AM
        reminderIntervalMin: 120,  // 2 hours
    };

    function getPrefs() {
        try {
            return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
        } catch { return { ...DEFAULT_PREFS }; }
    }

    function savePrefs(prefs) {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }

    // ═══════════════════════════════════
    //  INIT
    // ═══════════════════════════════════
    function init() {
        enabled = true;
        console.log('🔔 Engagement Engine initialized');

        // Run initial checks after a short delay (let app settle)
        setTimeout(() => {
            checkStreakRisk();
            checkMissionProgress();
            checkInactivity();
            startScheduledReminders();
            checkMilestones();
        }, 5000);
    }

    // ═══════════════════════════════════
    //  QUIET HOURS CHECK
    // ═══════════════════════════════════
    function isQuietHours() {
        const prefs = getPrefs();
        const hour = new Date().getHours();
        if (prefs.quietHoursStart > prefs.quietHoursEnd) {
            // Wraps midnight (e.g. 22-8)
            return hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd;
        }
        return hour >= prefs.quietHoursStart && hour < prefs.quietHoursEnd;
    }

    function canNotify() {
        return enabled && !isQuietHours();
    }

    // ═══════════════════════════════════
    //  1. STREAK PROTECTION
    // ═══════════════════════════════════
    function checkStreakRisk() {
        if (!canNotify()) return;
        const prefs = getPrefs();
        if (!prefs.streakAlerts) return;

        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        if (streak < 2) return; // Only protect existing streaks

        const lastVisitKey = localStorage.getItem('nexus_last_visit');
        const today = new Date().toDateString();

        if (lastVisitKey === today) return; // Already active today

        const hour = new Date().getHours();

        // Evening warning (6 PM+)
        if (hour >= 18) {
            const alertKey = 'nexus_streak_alert_' + today;
            if (localStorage.getItem(alertKey)) return; // Already alerted today
            localStorage.setItem(alertKey, '1');

            Notify.add('streak',
                `🔥 Protect your ${streak}-day streak!`,
                `You haven't practiced today. Complete any activity to keep your streak alive!`,
                '🔥', true);

            // Also send push
            Notify.sendPush(
                `🔥 ${streak}-day streak at risk!`,
                `Complete any activity before midnight to keep your streak.`,
                '🔥', 'nexus-streak-protect'
            );
        }
    }

    // ═══════════════════════════════════
    //  2. MISSION NUDGES
    // ═══════════════════════════════════
    function checkMissionProgress() {
        if (!canNotify()) return;
        const prefs = getPrefs();
        if (!prefs.missionNudges) return;
        if (typeof Missions === 'undefined') return;

        const progress = Missions.getProgress();
        const alertKey = 'nexus_mission_nudge_' + new Date().toDateString();
        if (localStorage.getItem(alertKey)) return;

        // Nudge if some missions are done but not all
        if (progress.completed > 0 && progress.completed < progress.total - 1) {
            const remaining = progress.total - progress.completed;
            const incompleteMissions = progress.missions.filter(m => !m.completed && !m.isBonus);

            if (incompleteMissions.length > 0) {
                const next = incompleteMissions[0];
                localStorage.setItem(alertKey, '1');

                Notify.add('info',
                    `🎯 ${remaining} mission${remaining > 1 ? 's' : ''} left today!`,
                    `Next up: ${next.icon} ${next.task} (+${next.xp} XP)`,
                    '🎯');
            }
        }

        // Congratulate if all regular missions done
        if (progress.completed === progress.total) {
            const congratsKey = 'nexus_missions_done_' + new Date().toDateString();
            if (!localStorage.getItem(congratsKey)) {
                localStorage.setItem(congratsKey, '1');
                Notify.add('milestone',
                    '🏆 All missions complete!',
                    `You crushed every mission today. Amazing discipline!`,
                    '🏆', true);
            }
        }
    }

    // ═══════════════════════════════════
    //  3. INACTIVITY RE-ENGAGEMENT
    // ═══════════════════════════════════
    function checkInactivity() {
        if (!canNotify()) return;
        const prefs = getPrefs();
        if (!prefs.inactivityAlerts) return;

        const lastActivity = localStorage.getItem('nexus_last_activity');
        if (!lastActivity) {
            localStorage.setItem('nexus_last_activity', Date.now().toString());
            return;
        }

        const elapsed = Date.now() - parseInt(lastActivity);
        const hours = elapsed / (1000 * 60 * 60);

        // Gentle nudge after 4 hours of inactivity during session
        if (hours >= 4 && hours < 24) {
            const key = 'nexus_inactivity_nudge_' + new Date().toDateString();
            if (localStorage.getItem(key)) return;
            localStorage.setItem(key, '1');

            const tips = [
                { text: 'Quick 5-min coding challenge?', feature: 'codingArena', icon: '💻' },
                { text: 'Practice a mock interview question?', feature: 'mockInterview', icon: '🎤' },
                { text: 'Learn something new with AI Teacher?', feature: 'aiTeacher', icon: '👨‍🏫' },
                { text: 'Check your career roadmap?', feature: 'careerPath', icon: '🎯' },
            ];
            const tip = tips[Math.floor(Math.random() * tips.length)];

            Notify.add('info',
                `${tip.icon} Time for a quick study break!`,
                tip.text,
                tip.icon);
        }

        // Re-engagement after 24+ hours
        if (hours >= 24) {
            const key = 'nexus_reengage_' + Math.floor(Date.now() / 86400000);
            if (localStorage.getItem(key)) return;
            localStorage.setItem(key, '1');

            Notify.add('streak',
                '👋 We miss you!',
                'Even 5 minutes of practice makes a difference. Jump back in!',
                '👋', true);

            Notify.sendPush(
                '👋 Your study streak needs you!',
                'Even 5 minutes of practice makes a difference.',
                '👋', 'nexus-reengage'
            );
        }
    }

    // ═══════════════════════════════════
    //  4. SCHEDULED STUDY REMINDERS
    // ═══════════════════════════════════
    function startScheduledReminders() {
        const prefs = getPrefs();
        if (!prefs.studyReminders) return;

        // Check every 30 minutes
        const timer = setInterval(() => {
            if (!canNotify()) return;

            const hour = new Date().getHours();
            const minute = new Date().getMinutes();

            // Morning motivation (9 AM)
            if (hour === 9 && minute < 30) {
                const key = 'nexus_morning_' + new Date().toDateString();
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, '1');
                    const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
                    const level = (typeof Features !== 'undefined') ? Features.getLevel(xp) : { name: 'Learner' };
                    Notify.add('info',
                        '🌅 Good morning, ' + level.name + '!',
                        'Ready to level up today? Your missions are waiting.',
                        '🌅');
                }
            }

            // Afternoon check-in (2 PM)
            if (hour === 14 && minute < 30) {
                const key = 'nexus_afternoon_' + new Date().toDateString();
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, '1');
                    checkMissionProgress();
                }
            }

            // Evening streak check (7 PM)
            if (hour === 19 && minute < 30) {
                checkStreakRisk();
            }

        }, 30 * 60 * 1000); // Every 30 minutes

        timers.push(timer);
    }

    // ═══════════════════════════════════
    //  5. MILESTONE CELEBRATIONS
    // ═══════════════════════════════════
    function checkMilestones() {
        if (!canNotify()) return;

        const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const chatCount = Object.keys(chats).length;
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const today = new Date().toDateString();

        // Chat milestones
        const chatMilestones = [5, 10, 25, 50, 100];
        for (const m of chatMilestones) {
            const key = `nexus_chat_milestone_${m}`;
            if (chatCount >= m && !localStorage.getItem(key)) {
                localStorage.setItem(key, '1');
                Notify.add('milestone',
                    `💬 ${m} conversations!`,
                    `You've had ${m} conversations with Nexus. Knowledge is power!`,
                    '💬');
                break;
            }
        }

        // XP milestones (already handled in all-features.js, but extra push here)
        const xpMilestones = [100, 500, 1000, 2500, 5000];
        for (const m of xpMilestones) {
            const key = `nexus_xp_push_${m}`;
            if (xp >= m && !localStorage.getItem(key)) {
                localStorage.setItem(key, '1');
                Notify.sendPush(
                    `🌟 ${m} XP Milestone!`,
                    `You've earned ${m} total XP. Keep pushing!`,
                    '🌟', `nexus-xp-${m}`
                );
                break;
            }
        }

        // Streak milestones
        const streakMilestones = [3, 7, 14, 30, 60, 100];
        for (const m of streakMilestones) {
            const key = `nexus_streak_milestone_${m}`;
            if (streak >= m && !localStorage.getItem(key)) {
                localStorage.setItem(key, '1');
                const msgs = {
                    3: '3 days strong! Building consistency.',
                    7: 'Week warrior! 7 days of growth.',
                    14: 'Two weeks! You\'re unstoppable.',
                    30: 'Monthly master! 30 days of dedication.',
                    60: 'Two months! Elite discipline.',
                    100: 'LEGENDARY! 100-day streak! 🏆'
                };
                Notify.sendPush(
                    `🔥 ${m}-day streak!`,
                    msgs[m] || `Amazing ${m}-day streak!`,
                    '🔥', `nexus-streak-${m}`
                );
                break;
            }
        }
    }

    // ═══════════════════════════════════
    //  6. ACTIVITY TRACKER (called by other modules)
    // ═══════════════════════════════════
    function trackActivity() {
        localStorage.setItem('nexus_last_activity', Date.now().toString());
    }

    // ═══════════════════════════════════
    //  7. SMART WELCOME (contextual greeting)
    // ═══════════════════════════════════
    function getSmartGreeting() {
        const hour = new Date().getHours();
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
        const name = localStorage.getItem('nexus_student_name') || 'there';

        let greeting = '';
        if (hour < 12) greeting = '🌅 Good morning';
        else if (hour < 17) greeting = '☀️ Good afternoon';
        else if (hour < 21) greeting = '🌆 Good evening';
        else greeting = '🌙 Burning the midnight oil';

        let suffix = '';
        if (streak >= 30) suffix = ' 👑 Legend status!';
        else if (streak >= 7) suffix = ` 🔥 ${streak}-day streak! Keep it up!`;
        else if (streak >= 3) suffix = ` 🔥 ${streak} days and counting!`;

        return { greeting: `${greeting}, ${name}!`, suffix, streak, xp };
    }

    // ═══════════════════════════════════
    //  CLEANUP
    // ═══════════════════════════════════
    function destroy() {
        enabled = false;
        timers.forEach(t => clearInterval(t));
        timers = [];
    }

    return {
        init, destroy,
        checkStreakRisk, checkMissionProgress, checkInactivity, checkMilestones,
        trackActivity, getSmartGreeting, getPrefs, savePrefs
    };
})();
