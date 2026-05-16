/* NEXUS v3.0 — App Controller + Router + Toast + Notification + Attachment + Auth */
const Toast = (() => {
    function show(msg, type = 'info', dur = 3500) {
        const c = document.querySelector('.toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 250); }, dur);
    }
    return { show };
})();

// Premium Notification System + Push Notifications
const Notify = (() => {
    let notifications = JSON.parse(localStorage.getItem('nexus_notifs') || '[]');
    let badge = null;
    let pushPermission = 'default';

    function init() {
        badge = document.getElementById('notif-badge');
        updateBadge();
        requestPushPermission();

        // Notification bell toggle
        document.getElementById('notif-bell')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const panel = document.getElementById('notif-panel');
            panel?.classList.toggle('active');
            document.getElementById('user-dropdown')?.classList.remove('active');
            if (panel?.classList.contains('active')) {
                renderList();
                markAllRead();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-bell')) {
                document.getElementById('notif-panel')?.classList.remove('active');
            }
        });

        // Clear button
        document.getElementById('notif-clear')?.addEventListener('click', () => {
            notifications = [];
            save();
            renderList();
            updateBadge();
        });

        // Achievement close
        document.getElementById('achievement-close')?.addEventListener('click', () => {
            document.getElementById('achievement-overlay')?.classList.remove('active');
        });
    }

    // Request push notification permission
    async function requestPushPermission() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            pushPermission = 'granted';
            return;
        }
        if (Notification.permission === 'denied') {
            pushPermission = 'denied';
            return;
        }
        // Show a nice prompt first (delayed so it's not annoying)
        setTimeout(async () => {
            const result = await Notification.requestPermission();
            pushPermission = result;
            if (result === 'granted') {
                Toast.show('🔔 Notifications enabled! You\'ll get alerts on your phone.', 'success');
                sendPush('Welcome to Nexus! 🚀', 'You\'ll now receive activity alerts on your phone.', '👋');
            }
        }, 3000);
    }

    // Send native push notification via service worker
    async function sendPush(title, body, icon, tag, url) {
        if (pushPermission !== 'granted') return;

        try {
            const reg = await navigator.serviceWorker?.ready;
            if (reg) {
                reg.active.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: `${icon || '🔔'} ${title}`,
                    body,
                    icon: '/assets/icon-192.png',
                    tag: tag || 'nexus-' + Date.now(),
                    url: url || '/'
                });
            }
        } catch (err) {
            // Fallback to basic Notification API
            try {
                new Notification(`${icon || '🔔'} ${title}`, {
                    body,
                    icon: '/assets/icon-192.png',
                    badge: '/assets/icon-192.png',
                    vibrate: [100, 50, 100],
                    tag: tag || 'nexus-' + Date.now()
                });
            } catch (e) {}
        }
    }

    function add(type, title, desc, icon, sendSystemNotif = false) {
        const notif = {
            id: Date.now(),
            type,
            icon: icon || getDefaultIcon(type),
            title, desc,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
        };
        notifications.unshift(notif);
        if (notifications.length > 50) notifications = notifications.slice(0, 50);
        save();
        updateBadge();

        // Ring the bell
        const bell = document.getElementById('notif-bell');
        bell?.classList.remove('has-notifs');
        void bell?.offsetWidth;
        bell?.classList.add('has-notifs');

        // Show toast
        const toastType = type === 'xp' ? 'xp' : type === 'milestone' ? 'warning' : type === 'streak' ? 'error' : 'info';
        Toast.show(`${icon || notif.icon} ${title}`, toastType);

        // Send native push notification for important events
        if (sendSystemNotif || type === 'milestone' || type === 'streak') {
            sendPush(title, desc, icon, `nexus-${type}-${Date.now()}`);
        }

        // Log to Firestore activity
        if (typeof DB !== 'undefined' && auth?.currentUser?.uid) {
            db.collection('users').doc(auth.currentUser.uid).collection('activity').add({
                type, title, desc,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
        }

        return notif;
    }

    function getDefaultIcon(type) {
        return type === 'xp' ? '✨' : type === 'milestone' ? '🏆' : type === 'streak' ? '🔥' : 'ℹ️';
    }

    function showAchievement(icon, title, desc, xp) {
        document.getElementById('achievement-icon').textContent = icon;
        document.getElementById('achievement-title').textContent = title;
        document.getElementById('achievement-desc').textContent = desc;
        document.getElementById('achievement-xp').textContent = `+${xp} XP`;
        document.getElementById('achievement-overlay')?.classList.add('active');
        // This is important — always send push for achievements
        add('milestone', title, desc, icon, true);
    }

    function renderList() {
        const list = document.getElementById('notif-list');
        if (!list) return;
        if (!notifications.length) {
            list.innerHTML = '<div class="notif-empty">✨ All caught up! No notifications.</div>';
            return;
        }
        list.innerHTML = notifications.slice(0, 30).map(n => `
            <div class="notif-item">
                <div class="notif-item-icon ${n.type}">${n.icon}</div>
                <div class="notif-item-content">
                    <div class="notif-item-title">${n.title}</div>
                    <div class="notif-item-desc">${n.desc}</div>
                    <div class="notif-item-time">${n.time}</div>
                </div>
            </div>
        `).join('');
    }

    function markAllRead() {
        notifications.forEach(n => n.read = true);
        save();
        updateBadge();
    }

    function updateBadge() {
        const unread = notifications.filter(n => !n.read).length;
        if (badge) {
            badge.textContent = unread > 99 ? '99+' : unread;
            badge.style.display = unread > 0 ? 'flex' : 'none';
        }
    }

    function save() {
        localStorage.setItem('nexus_notifs', JSON.stringify(notifications));
    }

    return { init, add, showAchievement, sendPush };
})();

// Document generation helper
const DocHelper = (() => {
    function downloadText(filename, content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        a.click(); URL.revokeObjectURL(url);
        Toast.show('📄 Document downloaded!', 'success');
    }

    function downloadHTML(filename, title, bodyHTML) {
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333;line-height:1.7}h1,h2,h3{color:#222}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:10px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}code{background:#f0f0f0;padding:2px 6px;border-radius:3px}pre{background:#1e1e2e;color:#e0e0e0;padding:16px;border-radius:8px;overflow-x:auto}blockquote{border-left:3px solid #4a6cf7;padding-left:16px;color:#666;font-style:italic}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:0.8rem;color:#999;text-align:center}</style></head><body>${bodyHTML}<div class="footer">Generated by Nexus — Developed by Prakhar</div></body></html>`;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename;
        a.click(); URL.revokeObjectURL(url);
        Toast.show('📄 Document downloaded!', 'success');
    }

    return { downloadText, downloadHTML };
})();

// File attachment manager
const Attachment = (() => {
    let currentFile = null;
    let currentBase64 = null;

    function init() {
        const attachBtn = document.getElementById('attach-btn');
        const fileInput = document.getElementById('file-input');
        const preview = document.getElementById('attach-preview');
        const thumb = document.getElementById('attach-thumb');
        const info = document.getElementById('attach-info');
        const removeBtn = document.getElementById('attach-remove');

        if (!attachBtn || !fileInput) return;

        attachBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            currentFile = file;

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    currentBase64 = ev.target.result;
                    thumb.src = ev.target.result;
                    thumb.style.display = 'block';
                    info.textContent = `📎 ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
                    preview.classList.add('active');
                };
                reader.readAsDataURL(file);
            } else {
                thumb.style.display = 'none';
                info.textContent = `📎 ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
                preview.classList.add('active');
                if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => { currentBase64 = ev.target.result; };
                    reader.readAsText(file);
                }
            }
            Toast.show(`📎 ${file.name} attached`, 'success');
            document.getElementById('send-btn').disabled = false;
        });

        removeBtn?.addEventListener('click', () => clear());
    }

    function clear() {
        currentFile = null; currentBase64 = null;
        const preview = document.getElementById('attach-preview');
        if (preview) preview.classList.remove('active');
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    }

    function getAttachmentContext() {
        if (!currentFile) return '';
        let ctx = `[User attached: "${currentFile.name}" (${currentFile.type}, ${(currentFile.size/1024).toFixed(1)} KB)]`;
        if (currentBase64 && typeof currentBase64 === 'string' && !currentBase64.startsWith('data:image')) {
            ctx += '\n\nFile contents:\n' + currentBase64.substring(0, 5000);
        }
        if (currentFile.type.startsWith('image/')) {
            ctx += '\n[This is an image. Acknowledge receipt and ask what to do with it.]';
        }
        return ctx;
    }

    function hasAttachment() { return !!currentFile; }
    return { init, clear, getAttachmentContext, hasAttachment };
})();

const Router = (() => {
    let current = 'chat';
    function go(featureId) {
        document.querySelectorAll('.feature-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('panel-' + featureId);
        if (panel) panel.classList.add('active');
        document.querySelectorAll('.fnav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.querySelector(`.fnav-item[data-feature="${featureId}"]`);
        if (navItem) navItem.classList.add('active');
        current = featureId;
        Features.initFeature(featureId);
    }
    function getCurrent() { return current; }
    return { go, getCurrent };
})();

const App = (() => {
    function init() {
        // Auth gate — redirect if not logged in
        Auth.onAuthChange(async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            // User is logged in — set up the app
            setupUserUI(user);
            await DB.migrateFromLocalStorage();
            // Load AI Memory profile
            if (typeof Memory !== 'undefined') Memory.load().catch(() => {});
            const streak = await DB.updateStreak();

            Preloader.init();
            setTimeout(() => {
                Settings.init();
                Notify.init();
                setupNav();
                setupVoice();
                setupKeyboard();
                setupBugReport();
                setupUserDropdown();
                Attachment.init();
                Chat.init();
                Router.go('chat');
                Settings.applyTheme();

                // Welcome notification
                const name = user.displayName || 'there';
                Notify.add('info', `Welcome back, ${name}!`, 'Ready to learn and grow today? 🚀', '👋');
                if (streak > 1) {
                    Notify.add('streak', `🔥 ${streak}-day streak!`, `You've been consistent for ${streak} days. Keep it up!`, '🔥');
                }
                if (streak === 7) {
                    Notify.showAchievement('🔥', 'Week Warrior!', 'You maintained a 7-day learning streak!', 100);
                } else if (streak === 30) {
                    Notify.showAchievement('💎', 'Monthly Master!', 'Incredible! 30 days of consistent learning!', 500);
                }
            }, 100);
        });
    }

    function setupUserUI(user) {
        // Header avatar
        const avatar = document.getElementById('header-avatar');
        if (avatar && user.photoURL) {
            avatar.src = user.photoURL;
        } else if (avatar) {
            // Show initial
            const name = user.displayName || user.email || 'U';
            avatar.style.display = 'none';
            const parent = avatar.parentElement;
            if (parent && !parent.querySelector('.avatar-initial')) {
                const initial = document.createElement('span');
                initial.className = 'avatar-initial';
                initial.textContent = name.charAt(0).toUpperCase();
                parent.appendChild(initial);
            }
        }
        // Welcome screen name
        const h2 = document.querySelector('.welcome-screen h2');
        const uname = user.displayName || '';
        if (h2 && uname) h2.textContent = `Hey ${uname}! 👋`;
        // Set name in localStorage for backward compat
        if (uname) localStorage.setItem('nexus_student_name', uname);
    }

    function setupUserDropdown() {
        const avatar = document.getElementById('header-user');
        const dropdown = document.getElementById('user-dropdown');
        const info = document.getElementById('user-dropdown-info');

        if (!avatar || !dropdown) return;

        // Populate info
        const user = auth.currentUser;
        if (user && info) {
            info.innerHTML = `<strong>${user.displayName || 'User'}</strong><br><span style="font-size:0.72rem;color:var(--text-tertiary);">${user.email}</span>`;
        }

        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => dropdown.classList.remove('active'));
        dropdown.addEventListener('click', e => e.stopPropagation());

        document.getElementById('dropdown-settings-btn')?.addEventListener('click', () => {
            dropdown.classList.remove('active');
            Settings.open();
        });
        document.getElementById('dropdown-bug-btn')?.addEventListener('click', () => {
            dropdown.classList.remove('active');
            openBugReport();
        });
        document.getElementById('dropdown-logout-btn')?.addEventListener('click', () => {
            dropdown.classList.remove('active');
            Auth.logout();
        });
    }

    function setupNav() {
        const featureNav = document.getElementById('feature-nav');
        const mobileBtn = document.getElementById('mobile-features-btn');
        const mobileOverlay = document.getElementById('mobile-nav-overlay');

        function closeMobileNav() {
            featureNav?.classList.remove('mobile-open');
            mobileOverlay?.classList.remove('active');
            if (mobileBtn) mobileBtn.textContent = '🧭';
        }

        function openMobileNav() {
            featureNav?.classList.add('mobile-open');
            mobileOverlay?.classList.add('active');
            if (mobileBtn) mobileBtn.textContent = '✕';
        }

        document.querySelectorAll('.fnav-item').forEach(item => {
            item.addEventListener('click', () => {
                const feature = item.dataset.feature;
                if (feature) Router.go(feature);
                closeMobileNav();
            });
        });

        // Mobile nav toggle
        mobileBtn?.addEventListener('click', () => {
            if (featureNav?.classList.contains('mobile-open')) {
                closeMobileNav();
            } else {
                closeSidebar();
                openMobileNav();
            }
        });
        mobileOverlay?.addEventListener('click', closeMobileNav);

        // Sidebar toggle with overlay
        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        function openSidebar() {
            sidebar?.classList.add('open');
            sidebarOverlay?.classList.add('active');
            closeMobileNav();
        }
        function closeSidebar() {
            sidebar?.classList.remove('open');
            sidebarOverlay?.classList.remove('active');
        }

        if (toggle) toggle.addEventListener('click', () => {
            if (sidebar?.classList.contains('open')) closeSidebar();
            else openSidebar();
        });

        sidebarOverlay?.addEventListener('click', closeSidebar);

        document.querySelector('.chat-history')?.addEventListener('click', e => {
            if (e.target.closest('.history-item')) closeSidebar();
        });

        document.getElementById('new-chat-btn')?.addEventListener('click', () => {
            setTimeout(closeSidebar, 100);
        });

        document.getElementById('settings-btn')?.addEventListener('click', () => { closeSidebar(); Settings.open(); });
        document.getElementById('header-settings-btn')?.addEventListener('click', () => { closeSidebar(); Settings.open(); });

        // Feature nav collapse (desktop)
        const collapseBtn = document.querySelector('.fnav-collapse-btn');
        if (collapseBtn) {
            const isCollapsed = localStorage.getItem('nexus_nav_collapsed') === '1';
            if (isCollapsed) featureNav?.classList.add('collapsed');
            collapseBtn.addEventListener('click', () => {
                featureNav?.classList.toggle('collapsed');
                const collapsed = featureNav?.classList.contains('collapsed');
                localStorage.setItem('nexus_nav_collapsed', collapsed ? '1' : '0');
                collapseBtn.textContent = collapsed ? '»' : '«';
            });
        }
    }

    function setupBugReport() {
        const bugBtn = document.getElementById('bug-report-btn');
        bugBtn?.addEventListener('click', openBugReport);
        document.getElementById('bug-modal-close')?.addEventListener('click', closeBugReport);
        document.getElementById('bug-modal')?.addEventListener('click', e => {
            if (e.target.id === 'bug-modal') closeBugReport();
        });

        document.getElementById('bug-submit-btn')?.addEventListener('click', async () => {
            const desc = document.getElementById('bug-description')?.value?.trim();
            const steps = document.getElementById('bug-steps')?.value?.trim();
            if (!desc) { Toast.show('Please describe the bug', 'error'); return; }
            try {
                await DB.submitBugReport({
                    description: desc,
                    steps: steps || 'Not provided',
                    device: navigator.userAgent,
                    screen: `${screen.width}x${screen.height}`,
                    url: window.location.href
                });
                Toast.show('🐛 Bug report submitted! Thank you!', 'success');
                closeBugReport();
                document.getElementById('bug-description').value = '';
                document.getElementById('bug-steps').value = '';
            } catch (err) {
                Toast.show('Failed to submit. Try again.', 'error');
            }
        });
    }

    function openBugReport() {
        const modal = document.getElementById('bug-modal');
        if (modal) modal.classList.add('active');
        const deviceInfo = document.getElementById('bug-device-info');
        if (deviceInfo) {
            deviceInfo.textContent = `📱 Device: ${navigator.userAgent.slice(0, 80)}... | Screen: ${screen.width}x${screen.height}`;
        }
    }

    function closeBugReport() {
        document.getElementById('bug-modal')?.classList.remove('active');
    }

    function setupVoice() {
        const micBtn = document.getElementById('mic-btn');
        const stopBtn = document.getElementById('stop-speak-btn');
        const waveform = document.querySelector('.voice-waveform');
        const speakLabel = document.querySelector('.speaking-label');

        Voice.setOnTranscript(text => {
            const preview = document.querySelector('.voice-preview');
            if (preview) { preview.textContent = text; preview.classList.add('active'); }
        });
        Voice.setOnFinalTranscript(text => {
            const input = document.getElementById('chat-input');
            if (input) { input.value = text; input.dispatchEvent(new Event('input')); }
            const preview = document.querySelector('.voice-preview');
            if (preview) { preview.classList.remove('active'); preview.textContent = ''; }
            setTimeout(() => Chat.handleSend(), 300);
        });
        Voice.setOnListeningChange(l => { if (micBtn) micBtn.classList.toggle('listening', l); });
        Voice.setOnSpeakingChange(s => {
            if (waveform) waveform.classList.toggle('active', s);
            if (speakLabel) speakLabel.classList.toggle('active', s);
            if (stopBtn) stopBtn.classList.toggle('active', s);
        });
        micBtn?.addEventListener('click', () => Voice.toggleListening());
        stopBtn?.addEventListener('click', () => Voice.stopSpeaking());
        if (micBtn && !Voice.isSupported()) micBtn.style.display = 'none';
    }

    function setupKeyboard() {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') { Settings.close(); closeBugReport(); Voice.stopSpeaking(); }
            if (e.ctrlKey && e.key === 'm') { e.preventDefault(); Voice.toggleListening(); }
            if (e.ctrlKey && e.key === 'n') { e.preventDefault(); Chat.newChat(); Router.go('chat'); }
        });
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
