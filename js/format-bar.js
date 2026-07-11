/* ============================================
   NEXUS — Chat Formatting Toolbar
   Phase 15.5: Markdown toolbar, emoji picker, preview
   ============================================ */
const FormatBar = (() => {
    const EMOJIS = ['😊','😂','🤔','👍','❤️','🔥','💡','🎯','✅','❌','⭐','🚀','💪','🙏','👀','📚','💻','🧠','📝','🎉','👏','💯','🤖','⚡','🌟','📊','🎓','🏆','💎','🔮'];

    const style = document.createElement('style');
    style.textContent = `
    .format-toolbar{display:flex;align-items:center;gap:1px;padding:3px 20px;background:transparent;border:none;flex-wrap:nowrap;transition:all 0.2s;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
    .format-toolbar::-webkit-scrollbar{display:none}
    @media(max-width:768px){.format-toolbar{padding:3px 10px;gap:0}}
    .format-toolbar.hidden{display:none}
    .fmt-btn{background:none;border:none;cursor:pointer;padding:5px 7px;border-radius:6px;color:var(--text-tertiary);font-size:0.78rem;transition:all 0.15s;font-family:var(--font-mono);display:flex;align-items:center;justify-content:center;min-width:28px;height:28px}
    .fmt-btn:hover{color:var(--text-primary);background:var(--bg-hover)}
    .fmt-btn:active{transform:scale(0.92)}
    .fmt-btn.active{color:var(--accent);background:rgba(74,108,247,0.1)}
    .fmt-sep{width:1px;height:18px;background:var(--border);margin:0 3px}
    .fmt-emoji-grid{position:absolute;bottom:100%;left:0;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;padding:8px;display:grid;grid-template-columns:repeat(10,1fr);gap:2px;box-shadow:var(--shadow-lg);z-index:100;display:none;min-width:260px}
    .fmt-emoji-grid.active{display:grid}
    .fmt-emoji{padding:4px;border-radius:6px;cursor:pointer;font-size:1rem;text-align:center;transition:all 0.15s;border:none;background:none}
    .fmt-emoji:hover{background:var(--bg-hover);transform:scale(1.2)}
    .fmt-char-count{font-size:0.65rem;color:var(--text-tertiary);margin-left:auto;padding:0 6px;font-family:var(--font-mono)}
    .fmt-char-count.warn{color:#f59e0b}
    .fmt-char-count.over{color:#ef4444}
    .fmt-preview-box{background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:8px;font-size:0.85rem;color:var(--text-primary);line-height:1.6;max-height:120px;overflow-y:auto;display:none}
    .fmt-preview-box.active{display:block}
    .fmt-preview-box h1,.fmt-preview-box h2,.fmt-preview-box h3{margin:0 0 4px;color:var(--text-primary)}
    .fmt-preview-box code{background:var(--bg-hover);padding:1px 4px;border-radius:4px;font-family:var(--font-mono);font-size:0.8rem}
    .fmt-preview-box pre{background:var(--bg-tertiary);padding:8px;border-radius:6px;overflow-x:auto}
    .fmt-preview-box strong{color:var(--text-primary)}
    .fmt-preview-box em{color:var(--text-secondary)}
    @media(max-width:768px){.fmt-emoji-grid{grid-template-columns:repeat(8,1fr);min-width:220px}}
    `;
    document.head.appendChild(style);

    let toolbar = null, previewBox = null, emojiGrid = null, isPreviewMode = false;

    function init() {
        const inputArea = document.querySelector('.input-area') || document.querySelector('.chat-input-container');
        const chatInput = document.getElementById('chat-input');
        if (!inputArea || !chatInput) return;

        // Create preview box
        previewBox = document.createElement('div');
        previewBox.className = 'fmt-preview-box';
        inputArea.parentNode.insertBefore(previewBox, inputArea);

        // Create toolbar
        toolbar = document.createElement('div');
        toolbar.className = 'format-toolbar';
        toolbar.innerHTML = `
            <button class="fmt-btn" data-fmt="bold" title="Bold (Ctrl+B)"><b>B</b></button>
            <button class="fmt-btn" data-fmt="italic" title="Italic (Ctrl+I)"><i>I</i></button>
            <button class="fmt-btn" data-fmt="code" title="Inline code">⌨</button>
            <button class="fmt-btn" data-fmt="codeblock" title="Code block">{ }</button>
            <div class="fmt-sep"></div>
            <button class="fmt-btn" data-fmt="heading" title="Heading">H</button>
            <button class="fmt-btn" data-fmt="list" title="Bullet list">•≡</button>
            <button class="fmt-btn" data-fmt="link" title="Link">🔗</button>
            <div class="fmt-sep"></div>
            <button class="fmt-btn" data-fmt="emoji" title="Emoji" style="position:relative">😊</button>
            <button class="fmt-btn" data-fmt="preview" title="Toggle preview">👁</button>
            <div class="fmt-char-count" id="fmt-char-count">0</div>
        `;
        inputArea.parentNode.insertBefore(toolbar, inputArea);

        // Emoji grid
        emojiGrid = document.createElement('div');
        emojiGrid.className = 'fmt-emoji-grid';
        emojiGrid.innerHTML = EMOJIS.map(e => `<button class="fmt-emoji">${e}</button>`).join('');
        toolbar.querySelector('[data-fmt="emoji"]').appendChild(emojiGrid);

        // Button handlers
        toolbar.querySelectorAll('.fmt-btn[data-fmt]').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                handleFormat(btn.dataset.fmt, chatInput);
            });
        });

        // Emoji clicks
        emojiGrid.querySelectorAll('.fmt-emoji').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                insertAtCursor(chatInput, btn.textContent);
                emojiGrid.classList.remove('active');
            });
        });

        // Close emoji on outside click
        document.addEventListener('click', e => {
            if (!e.target.closest('[data-fmt="emoji"]')) emojiGrid.classList.remove('active');
        });

        // Character count
        chatInput.addEventListener('input', () => updateCharCount(chatInput));

        // Keyboard shortcuts
        chatInput.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 'b') { e.preventDefault(); handleFormat('bold', chatInput); }
            if (e.ctrlKey && e.key === 'i') { e.preventDefault(); handleFormat('italic', chatInput); }
        });

        // Preview update
        chatInput.addEventListener('input', () => {
            if (isPreviewMode) updatePreview(chatInput);
        });

        console.log('[FormatBar] Initialized');
    }

    function handleFormat(fmt, input) {
        if (fmt === 'emoji') {
            emojiGrid.classList.toggle('active');
            return;
        }
        if (fmt === 'preview') {
            isPreviewMode = !isPreviewMode;
            toolbar.querySelector('[data-fmt="preview"]').classList.toggle('active', isPreviewMode);
            previewBox.classList.toggle('active', isPreviewMode);
            if (isPreviewMode) updatePreview(input);
            return;
        }

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const selected = input.value.substring(start, end);

        const formats = {
            bold: { before: '**', after: '**', placeholder: 'bold text' },
            italic: { before: '*', after: '*', placeholder: 'italic text' },
            code: { before: '`', after: '`', placeholder: 'code' },
            codeblock: { before: '\n```\n', after: '\n```\n', placeholder: 'code here' },
            heading: { before: '## ', after: '', placeholder: 'Heading' },
            list: { before: '\n- ', after: '', placeholder: 'item' },
            link: { before: '[', after: '](url)', placeholder: 'link text' },
        };

        const f = formats[fmt];
        if (!f) return;

        const text = selected || f.placeholder;
        const newText = f.before + text + f.after;
        input.setRangeText(newText, start, end, 'end');
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        updateCharCount(input);
    }

    function insertAtCursor(input, text) {
        const start = input.selectionStart;
        input.setRangeText(text, start, input.selectionEnd, 'end');
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        updateCharCount(input);
    }

    function updateCharCount(input) {
        const count = input.value.length;
        const el = document.getElementById('fmt-char-count');
        if (!el) return;
        el.textContent = count;
        el.className = 'fmt-char-count' + (count > 4000 ? ' over' : count > 3000 ? ' warn' : '');
    }

    function updatePreview(input) {
        if (!previewBox) return;
        let md = input.value || '';
        // Simple markdown rendering
        md = md.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        md = md.replace(/`([^`]+)`/g, '<code>$1</code>');
        md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');
        md = md.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        md = md.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        md = md.replace(/^- (.+)$/gm, '• $1<br>');
        md = md.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--accent)">$1</a>');
        md = md.replace(/\n/g, '<br>');
        previewBox.innerHTML = md || '<span style="color:var(--text-tertiary)">Preview will appear here...</span>';
    }

    return { init };
})();
