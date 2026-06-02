/* NEXUS — Social Features
   Share conversations, profile cards, and community features.
*/
const Social = (() => {
    let initialized = false;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
    .share-overlay{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s ease}
    .share-overlay.active{opacity:1;visibility:visible}
    .share-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:20px;padding:28px 24px;max-width:380px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,0.4);transform:scale(0.9) translateY(20px);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)}
    .share-overlay.active .share-modal{transform:scale(1) translateY(0)}
    .share-modal h3{font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:16px;text-align:center}
    .share-options{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
    .share-option-btn{display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid var(--border);background:var(--bg-secondary);border-radius:12px;cursor:pointer;font-family:var(--font-body);font-size:0.88rem;color:var(--text-primary);transition:all 0.2s}
    .share-option-btn:hover{border-color:var(--accent);transform:translateX(4px)}
    .share-option-btn .share-icon{font-size:1.3rem;width:32px;text-align:center}
    .share-option-btn.whatsapp:hover{border-color:#25D366;background:rgba(37,211,102,0.05)}
    .share-option-btn.twitter:hover{border-color:#1DA1F2;background:rgba(29,161,242,0.05)}
    .share-option-btn.linkedin:hover{border-color:#0A66C2;background:rgba(10,102,194,0.05)}
    .share-option-btn.copy:hover{border-color:var(--accent);background:rgba(74,108,247,0.05)}
    .share-close{position:absolute;top:12px;right:14px;background:none;border:none;color:var(--text-tertiary);font-size:1.3rem;cursor:pointer;padding:4px 8px;border-radius:8px}
    .share-close:hover{background:var(--bg-hover);color:var(--text-primary)}
    .profile-overlay{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s ease}
    .profile-overlay.active{opacity:1;visibility:visible}
    .profile-card{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;padding:32px 24px;max-width:340px;width:90%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)}
    .profile-overlay.active .profile-card{transform:scale(1)}
    .profile-avatar-wrap{width:72px;height:72px;border-radius:50%;margin:0 auto 12px;background:linear-gradient(135deg,var(--accent),#6366f1);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:white;border:3px solid var(--border)}
    .profile-name{font-size:1.2rem;font-weight:700;color:var(--text-primary);margin-bottom:4px}
    .profile-level{font-size:0.78rem;color:var(--accent);font-weight:600;margin-bottom:16px}
    .profile-stats{display:flex;justify-content:center;gap:20px;margin-bottom:16px}
    .profile-stat{text-align:center}
    .profile-stat-value{font-size:1.4rem;font-weight:800;color:var(--text-primary)}
    .profile-stat-label{font-size:0.68rem;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px}
    .profile-xp-bar{width:100%;height:6px;background:var(--bg-tertiary);border-radius:99px;margin:12px 0;overflow:hidden}
    .profile-xp-fill{height:100%;background:linear-gradient(90deg,var(--accent),#6366f1);border-radius:99px;transition:width 0.8s ease}
    .profile-xp-label{font-size:0.72rem;color:var(--text-tertiary);margin-bottom:16px}
    .profile-features{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:16px}
    .profile-feature-tag{padding:4px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:12px;font-size:0.72rem;color:var(--text-secondary)}
    .profile-close{width:100%;padding:10px;border:none;background:var(--bg-secondary);color:var(--text-primary);border-radius:12px;cursor:pointer;font-family:var(--font-body);font-size:0.88rem;transition:all 0.2s}
    .profile-close:hover{background:var(--bg-hover)}
    .profile-member-since{font-size:0.7rem;color:var(--text-tertiary);margin-bottom:12px}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[Social] Initialized');
    }

    function shareChat(chatId) {
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const chat = chats[chatId];
        if (!chat || !chat.messages?.length) {
            if (typeof showToast === 'function') showToast('No conversation to share', 'error');
            return;
        }

        // Build text version
        const textVersion = chat.messages.map(m => {
            const role = m.role === 'user' ? '👤 You' : '🤖 Nexus';
            const text = m.text || m.content || '';
            return `${role}: ${text}`;
        }).join('\n\n');

        const title = chat.title || 'Nexus AI Conversation';
        const shareText = `Check out my conversation with Nexus AI!\n\n${title}\n\n${textVersion.substring(0, 500)}${textVersion.length > 500 ? '...' : ''}`;
        const shareUrl = 'https://nexuspv.netlify.app';

        showShareModal(title, shareText, shareUrl, textVersion);
    }

    function showShareModal(title, shareText, shareUrl, fullText) {
        // Remove existing
        document.querySelector('.share-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal" style="position:relative">
                <button class="share-close">✕</button>
                <h3>📤 Share Conversation</h3>
                <div class="share-options">
                    <button class="share-option-btn copy" data-action="copy">
                        <span class="share-icon">📋</span>
                        <span>Copy conversation text</span>
                    </button>
                    <button class="share-option-btn whatsapp" data-action="whatsapp">
                        <span class="share-icon">💬</span>
                        <span>Share via WhatsApp</span>
                    </button>
                    <button class="share-option-btn twitter" data-action="twitter">
                        <span class="share-icon">🐦</span>
                        <span>Share on X (Twitter)</span>
                    </button>
                    <button class="share-option-btn linkedin" data-action="linkedin">
                        <span class="share-icon">💼</span>
                        <span>Share on LinkedIn</span>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        // Close handlers
        overlay.querySelector('.share-close').onclick = () => closeOverlay(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(overlay); });

        // Action handlers
        overlay.querySelectorAll('.share-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const encoded = encodeURIComponent(shareText.substring(0, 300));
                const encodedUrl = encodeURIComponent(shareUrl);

                switch (action) {
                    case 'copy':
                        navigator.clipboard.writeText(fullText).then(() => {
                            if (typeof showToast === 'function') showToast('Conversation copied!', 'success');
                        }).catch(() => {
                            if (typeof showToast === 'function') showToast('Failed to copy', 'error');
                        });
                        break;
                    case 'whatsapp':
                        window.open(`https://wa.me/?text=${encoded}`, '_blank');
                        break;
                    case 'twitter':
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my AI conversation on Nexus! 🚀')}&url=${encodedUrl}`, '_blank');
                        break;
                    case 'linkedin':
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
                        break;
                }
                closeOverlay(overlay);
            });
        });
    }

    function showProfile() {
        document.querySelector('.profile-overlay')?.remove();

        const name = localStorage.getItem('nexus_student_name') || 'Student';
        const xp = parseInt(localStorage.getItem('nexus_xp') || '0');
        const streak = parseInt(localStorage.getItem('nexus_streak') || '0');
        const levelInfo = (typeof Features !== 'undefined') ? Features.getLevel(xp) : { level: 1, name: 'Beginner', icon: '🌱', min: 0, max: 200 };
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        const totalMsgs = Object.values(chats).reduce((s, c) => s + (c.messages?.length || 0), 0);
        const progress = Math.min(((xp - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100, 100);
        const initial = name.charAt(0).toUpperCase();
        const memberSince = localStorage.getItem('nexus_created') || new Date().toISOString();
        const memberDate = new Date(memberSince).toLocaleDateString('en', { month: 'long', year: 'numeric' });

        const overlay = document.createElement('div');
        overlay.className = 'profile-overlay';
        overlay.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar-wrap">${initial}</div>
                <div class="profile-name">${name}</div>
                <div class="profile-level">${levelInfo.icon} Level ${levelInfo.level}: ${levelInfo.name}</div>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${xp}</div>
                        <div class="profile-stat-label">XP</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${streak}🔥</div>
                        <div class="profile-stat-label">Streak</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${totalMsgs}</div>
                        <div class="profile-stat-label">Messages</div>
                    </div>
                </div>
                <div class="profile-xp-bar"><div class="profile-xp-fill" style="width:${progress}%"></div></div>
                <div class="profile-xp-label">${Math.round(levelInfo.max - xp)} XP to Level ${levelInfo.level + 1}</div>
                <div class="profile-member-since">Member since ${memberDate}</div>
                <div class="profile-features">
                    <span class="profile-feature-tag">💬 AI Chat</span>
                    <span class="profile-feature-tag">🎤 Interview</span>
                    <span class="profile-feature-tag">💻 Coding</span>
                    <span class="profile-feature-tag">🎯 Career</span>
                </div>
                <button class="profile-close">Close</button>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        overlay.querySelector('.profile-close').onclick = () => closeOverlay(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(overlay); });
    }

    function closeOverlay(overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }

    return { init, shareChat, showProfile, showShareModal };
})();
