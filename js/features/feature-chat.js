/* NEXUS v2.0 — Feature Chat Helper (shared by all feature panels) */
const FeatureChat = (() => {
    function renderMarkdown(text) {
        if (!text) return '';
        let h = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, l, c) => `<pre><code class="language-${l||'text'}">${c.trim()}</code></pre>`);
        h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
        h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
        h = h.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
        h = h.replace(/(<li>[\s\S]*?<\/li>(\n)?)+/g, '<ul>$&</ul>');
        h = h.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        h = h.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (m, hd, bd) => {
            const hs = hd.split('|').map(x=>`<th>${x.trim()}</th>`).join('');
            const rs = bd.trim().split('\n').map(r => '<tr>'+r.split('|').filter(Boolean).map(c=>`<td>${c.trim()}</td>`).join('')+'</tr>').join('');
            return `<table><thead><tr>${hs}</tr></thead><tbody>${rs}</tbody></table>`;
        });
        h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        h = h.replace(/\n\n/g, '</p><p>');
        h = h.replace(/\n/g, '<br>');
        h = '<p>'+h+'</p>';
        h = h.replace(/<p>\s*<\/p>/g,'');
        h = h.replace(/<p>\s*(<[huo])/g,'$1').replace(/(<\/[huo][l1-3]?>)\s*<\/p>/g,'$1');
        h = h.replace(/<p>\s*(<pre>)/g,'$1').replace(/(<\/pre>)\s*<\/p>/g,'$1');
        h = h.replace(/<p>\s*(<table>)/g,'$1').replace(/(<\/table>)\s*<\/p>/g,'$1');
        h = h.replace(/<p>\s*(<blockquote>)/g,'$1').replace(/(<\/blockquote>)\s*<\/p>/g,'$1');
        return h;
    }

    function addMsg(container, role, html) {
        const d = document.createElement('div');
        d.className = `message ${role}-message`;
        if (role === 'nexus') {
            d.innerHTML = `<div class="message-avatar"><img src="assets/logo.png" alt="N"></div><div class="message-content"><div class="message-bubble">${html}</div></div>`;
        } else {
            d.innerHTML = `<div class="message-avatar">👤</div><div class="message-content"><div class="message-bubble">${html}</div></div>`;
        }
        container.appendChild(d);
        container.scrollTop = container.scrollHeight;
        return d;
    }

    async function sendToFeature(featureId, msgContainer, userText, extraContext) {
        // Add user message
        const escaped = userText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        addMsg(msgContainer, 'user', escaped);

        // Add typing indicator
        const typingEl = addMsg(msgContainer, 'nexus', '<div class="typing-dots"><span></span><span></span><span></span></div>');

        try {
            let fullText = '';
            const bubble = typingEl.querySelector('.message-bubble');
            for await (const chunk of Nexus.stream(featureId, userText, extraContext)) {
                fullText += chunk;
                bubble.innerHTML = renderMarkdown(fullText);
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
            bubble.innerHTML = renderMarkdown(fullText);
            // Add copy buttons to code blocks
            bubble.querySelectorAll('pre').forEach(pre => {
                if (pre.querySelector('.code-copy-btn')) return;
                const btn = document.createElement('button');
                btn.className = 'code-copy-btn'; btn.textContent = 'Copy';
                btn.onclick = () => {
                    navigator.clipboard.writeText(pre.querySelector('code')?.textContent || pre.textContent);
                    btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000);
                };
                pre.style.position = 'relative'; pre.appendChild(btn);
            });
            msgContainer.scrollTop = msgContainer.scrollHeight;
            // Speak if enabled
            if (typeof Voice !== 'undefined') Voice.speak(fullText);
            return fullText;
        } catch (err) {
            typingEl.querySelector('.message-bubble').innerHTML = `<p style="color:var(--red)">⚠️ ${err.message}</p>`;
            throw err;
        }
    }

    // Setup a feature panel's chat input
    function setupInput(inputEl, sendBtnEl, featureId, msgContainer, extraContextFn) {
        const send = () => {
            const text = inputEl.value.trim();
            if (!text) return;
            inputEl.value = '';
            inputEl.style.height = 'auto';
            sendBtnEl.disabled = true;
            const ctx = extraContextFn ? extraContextFn() : '';
            sendToFeature(featureId, msgContainer, text, ctx);
        };
        inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
        inputEl.addEventListener('input', () => { inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 100)+'px'; sendBtnEl.disabled = !inputEl.value.trim(); });
        sendBtnEl.addEventListener('click', send);
    }

    return { renderMarkdown, addMsg, sendToFeature, setupInput };
})();
