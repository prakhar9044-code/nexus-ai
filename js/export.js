/* NEXUS — Advanced Export (Phase 12)
   Export chats as Markdown, JSON, Image, or share via Web Share API
*/
const Export = (() => {
    let initialized = false;

    const style = document.createElement('style');
    style.textContent = `
    .export-overlay{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:all 0.3s}
    .export-overlay.active{opacity:1;visibility:visible}
    .export-modal{background:var(--bg-primary);border:1px solid var(--border);border-radius:24px;width:min(400px,90vw);padding:28px;box-shadow:0 24px 80px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}
    .export-overlay.active .export-modal{transform:scale(1)}
    .export-title{font-size:1.1rem;font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:8px}
    .export-subtitle{font-size:0.75rem;color:var(--text-tertiary);margin-bottom:20px}
    .export-options{display:flex;flex-direction:column;gap:8px}
    .export-option{display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--border);border-radius:14px;cursor:pointer;transition:all 0.15s;background:var(--bg-secondary)}
    .export-option:hover{border-color:var(--accent);transform:translateX(4px)}
    .export-option-icon{font-size:1.3rem;flex-shrink:0}
    .export-option-info{flex:1}
    .export-option-name{font-size:0.85rem;font-weight:700;color:var(--text-primary)}
    .export-option-desc{font-size:0.7rem;color:var(--text-tertiary);margin-top:2px}
    .export-option-arrow{color:var(--text-tertiary);font-size:0.85rem}
    .export-close{position:absolute;top:16px;right:16px;background:none;border:none;font-size:1.1rem;color:var(--text-tertiary);cursor:pointer}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createOverlay();
        console.log('[Export] Initialized');
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'export-overlay';
        overlay.id = 'export-overlay';
        overlay.innerHTML = `
            <div class="export-modal" style="position:relative">
                <button class="export-close" id="export-close">✕</button>
                <div class="export-title">📤 Export Chat</div>
                <div class="export-subtitle">Choose a format to export your conversation</div>
                <div class="export-options">
                    <div class="export-option" data-format="markdown">
                        <span class="export-option-icon">📝</span>
                        <div class="export-option-info">
                            <div class="export-option-name">Markdown (.md)</div>
                            <div class="export-option-desc">Formatted with headers, bold, code blocks</div>
                        </div>
                        <span class="export-option-arrow">→</span>
                    </div>
                    <div class="export-option" data-format="json">
                        <span class="export-option-icon">📋</span>
                        <div class="export-option-info">
                            <div class="export-option-name">JSON (.json)</div>
                            <div class="export-option-desc">Structured data for developers</div>
                        </div>
                        <span class="export-option-arrow">→</span>
                    </div>
                    <div class="export-option" data-format="text">
                        <span class="export-option-icon">📄</span>
                        <div class="export-option-info">
                            <div class="export-option-name">Plain Text (.txt)</div>
                            <div class="export-option-desc">Simple text format</div>
                        </div>
                        <span class="export-option-arrow">→</span>
                    </div>
                    <div class="export-option" data-format="clipboard">
                        <span class="export-option-icon">📎</span>
                        <div class="export-option-info">
                            <div class="export-option-name">Copy to Clipboard</div>
                            <div class="export-option-desc">Formatted text ready to paste</div>
                        </div>
                        <span class="export-option-arrow">→</span>
                    </div>
                    <div class="export-option" data-format="share" id="export-share-option" style="display:none">
                        <span class="export-option-icon">🔗</span>
                        <div class="export-option-info">
                            <div class="export-option-name">Share</div>
                            <div class="export-option-desc">Share via native share menu</div>
                        </div>
                        <span class="export-option-arrow">→</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Show share if available
        if (navigator.share) {
            document.getElementById('export-share-option').style.display = 'flex';
        }

        document.getElementById('export-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        overlay.querySelectorAll('.export-option').forEach(opt => {
            opt.addEventListener('click', () => {
                exportAs(opt.dataset.format);
                close();
            });
        });
    }

    function getChatData() {
        const chatId = typeof Chat !== 'undefined' ? Chat.getCurrentChatId() : null;
        if (!chatId) return null;
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        return chats[chatId] || null;
    }

    function exportAs(format) {
        const chat = getChatData();
        if (!chat || !chat.messages?.length) {
            Toast.show('No messages to export!', 'warning');
            return;
        }

        switch (format) {
            case 'markdown': exportMarkdown(chat); break;
            case 'json': exportJSON(chat); break;
            case 'text': exportText(chat); break;
            case 'clipboard': exportClipboard(chat); break;
            case 'share': exportShare(chat); break;
        }
    }

    function exportMarkdown(chat) {
        let md = `# ${chat.title || 'Nexus Chat'}\n\n`;
        md += `> Exported from Nexus AI on ${new Date().toLocaleString()}\n\n---\n\n`;
        chat.messages.forEach(msg => {
            const role = msg.role === 'user' ? '**You**' : '**Nexus AI**';
            const time = msg.time ? `*${new Date(msg.time).toLocaleTimeString()}*` : '';
            const text = msg.text || msg.content || '';
            md += `### ${role} ${time}\n\n${text}\n\n---\n\n`;
        });
        downloadFile(md, `nexus-${chat.title || 'chat'}-${dateStr()}.md`, 'text/markdown');
        Toast.show('📝 Exported as Markdown!', 'success');
    }

    function exportJSON(chat) {
        const data = {
            title: chat.title,
            exported: new Date().toISOString(),
            platform: 'Nexus AI',
            messageCount: chat.messages.length,
            messages: chat.messages.map(m => ({
                role: m.role,
                text: m.text || m.content || '',
                time: m.time || null
            }))
        };
        downloadFile(JSON.stringify(data, null, 2), `nexus-${chat.title || 'chat'}-${dateStr()}.json`, 'application/json');
        Toast.show('📋 Exported as JSON!', 'success');
    }

    function exportText(chat) {
        let txt = `=== ${chat.title || 'Nexus Chat'} ===\n`;
        txt += `Exported: ${new Date().toLocaleString()}\n\n`;
        chat.messages.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Nexus AI';
            const time = msg.time ? `[${new Date(msg.time).toLocaleTimeString()}]` : '';
            txt += `${time} ${role}:\n${msg.text || msg.content || ''}\n\n`;
        });
        downloadFile(txt, `nexus-${chat.title || 'chat'}-${dateStr()}.txt`, 'text/plain');
        Toast.show('📄 Exported as Text!', 'success');
    }

    function exportClipboard(chat) {
        let txt = '';
        chat.messages.forEach(msg => {
            const role = msg.role === 'user' ? '👤 You' : '🤖 Nexus';
            txt += `${role}:\n${msg.text || msg.content || ''}\n\n`;
        });
        navigator.clipboard.writeText(txt).then(() => {
            Toast.show('📎 Copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = txt; document.body.appendChild(ta);
            ta.select(); document.execCommand('copy');
            document.body.removeChild(ta);
            Toast.show('📎 Copied!', 'success');
        });
    }

    async function exportShare(chat) {
        let txt = `${chat.title || 'Nexus Chat'}\n\n`;
        chat.messages.slice(-6).forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Nexus AI';
            txt += `${role}: ${(msg.text || msg.content || '').substring(0, 200)}\n\n`;
        });
        try {
            await navigator.share({ title: chat.title || 'Nexus Chat', text: txt });
            Toast.show('🔗 Shared!', 'success');
        } catch (e) {
            if (e.name !== 'AbortError') Toast.show('Share failed', 'error');
        }
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
    }

    function dateStr() { return new Date().toISOString().split('T')[0]; }

    function open() { document.getElementById('export-overlay')?.classList.add('active'); }
    function close() { document.getElementById('export-overlay')?.classList.remove('active'); }

    return { init, open, close, exportAs };
})();
