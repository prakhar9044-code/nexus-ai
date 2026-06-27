/* NEXUS — Code Syntax Highlighting (Phase 13)
   Renders code blocks in AI responses with syntax-colored tokens
*/
const CodeHighlight = (() => {
    let initialized = false;

    const KEYWORDS = {
        js: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|delete|void|null|undefined|true|false|NaN|Infinity|console|document|window)\b/g,
        py: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|is|in|True|False|None|self|print|range|len|int|str|float|list|dict|set|tuple)\b/g,
        css: /\b(color|background|display|flex|grid|margin|padding|border|font|width|height|position|top|left|right|bottom|z-index|overflow|opacity|transform|transition|animation|align|justify|gap|none|auto|inherit|solid|relative|absolute|fixed|block|inline|hidden)\b/g,
        html: /\b(div|span|input|button|form|table|tr|td|th|ul|ol|li|a|p|h[1-6]|img|svg|section|header|footer|nav|main|article|aside|body|head|html|script|style|link|meta)\b/g,
        generic: /\b(function|return|if|else|for|while|class|new|this|import|export|const|let|var|true|false|null|try|catch|async|await)\b/g
    };

    const style = document.createElement('style');
    style.textContent = `
    .code-block-wrapper{position:relative;margin:8px 0;border-radius:12px;overflow:hidden;border:1px solid var(--border);background:#1a1b26}
    .code-block-header{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:#16171f;border-bottom:1px solid rgba(255,255,255,0.06)}
    .code-block-lang{font-size:0.65rem;font-weight:700;color:#7aa2f7;text-transform:uppercase;letter-spacing:0.5px}
    .code-block-copy{background:none;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:3px 10px;font-size:0.65rem;color:#a9b1d6;cursor:pointer;font-family:var(--font-body);transition:all 0.15s}
    .code-block-copy:hover{color:#fff;border-color:rgba(255,255,255,0.3);background:rgba(255,255,255,0.05)}
    .code-block-copy.copied{color:#9ece6a;border-color:rgba(158,206,106,0.3)}
    .code-block-pre{margin:0;padding:14px 16px;overflow-x:auto;font-size:0.82rem;line-height:1.7;color:#a9b1d6;font-family:'Fira Code','Cascadia Code','JetBrains Mono',monospace;-webkit-overflow-scrolling:touch}
    .code-block-pre::-webkit-scrollbar{height:4px}
    .code-block-pre::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
    .hl-keyword{color:#bb9af7;font-weight:600}
    .hl-string{color:#9ece6a}
    .hl-number{color:#ff9e64}
    .hl-comment{color:#565f89;font-style:italic}
    .hl-func{color:#7aa2f7}
    .hl-operator{color:#89ddff}
    .hl-tag{color:#f7768e}
    .hl-attr{color:#bb9af7}
    .hl-builtin{color:#e0af68}
    .hl-punctuation{color:#9abdf5}
    .inline-code{background:var(--bg-tertiary,rgba(100,100,100,0.15));padding:1px 6px;border-radius:4px;font-family:'Fira Code','Cascadia Code',monospace;font-size:0.85em;color:var(--accent)}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        observeMessages();
        console.log('[CodeHighlight] Initialized');
    }

    function observeMessages() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) highlightNode(node);
                });
            });
        });
        setTimeout(() => {
            const area = document.querySelector('.messages-area');
            if (area) {
                observer.observe(area, { childList: true, subtree: true });
                area.querySelectorAll('.message-bubble').forEach(highlightNode);
            }
        }, 1200);
    }

    function highlightNode(el) {
        if (!el.querySelectorAll) return;
        // Find raw code blocks in text (```lang\ncode```)
        const bubbles = el.classList?.contains('message-bubble') ? [el] : el.querySelectorAll('.message-bubble');
        bubbles.forEach(bubble => {
            if (bubble.dataset.highlighted) return;
            const html = bubble.innerHTML;
            if (!html.includes('```')) return;
            bubble.innerHTML = processCodeBlocks(html);
            bubble.dataset.highlighted = '1';
            // Wire copy buttons
            bubble.querySelectorAll('.code-block-copy').forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.closest('.code-block-wrapper')?.querySelector('.code-block-pre')?.textContent || '';
                    navigator.clipboard.writeText(code).then(() => {
                        btn.textContent = '✓ Copied';
                        btn.classList.add('copied');
                        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
                    });
                });
            });
        });
    }

    function processCodeBlocks(html) {
        return html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            lang = lang || 'text';
            const highlighted = highlightCode(decodeHtml(code.trim()), lang.toLowerCase());
            return `<div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-block-lang">${escHtml(lang)}</span>
                    <button class="code-block-copy">Copy</button>
                </div>
                <pre class="code-block-pre">${highlighted}</pre>
            </div>`;
        }).replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
    }

    function highlightCode(code, lang) {
        let escaped = escHtml(code);
        // Comments
        escaped = escaped.replace(/(\/\/.*$|#.*$)/gm, '<span class="hl-comment">$1</span>');
        escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>');
        // Strings
        escaped = escaped.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span class="hl-string">$&</span>');
        // Numbers
        escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
        // Keywords
        const kwRegex = KEYWORDS[lang] || KEYWORDS.generic;
        escaped = escaped.replace(kwRegex, '<span class="hl-keyword">$&</span>');
        // Function calls
        escaped = escaped.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="hl-func">$&</span>');
        return escaped;
    }

    function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function decodeHtml(s) { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; }

    return { init, highlightNode };
})();
