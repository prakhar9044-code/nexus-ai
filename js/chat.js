/* NEXUS v2.0 — Chat UI (uses Nexus engine) */
const Chat = (() => {
    let currentChatId = null, isProcessing = false;

    function init() {
        setupInput(); setupWelcomeChips(); loadCurrentChat(); Settings.updateWelcomeName();
        document.getElementById('new-chat-btn')?.addEventListener('click', () => { newChat(); Router.go('chat'); });
        document.getElementById('export-btn')?.addEventListener('click', exportChat);
    }

    function setupInput() {
        const input = document.getElementById('chat-input'), btn = document.getElementById('send-btn');
        input.addEventListener('keydown', e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} });
        input.addEventListener('input', () => { input.style.height='auto'; input.style.height=Math.min(input.scrollHeight,150)+'px'; btn.disabled=!input.value.trim(); });
        btn.addEventListener('click', handleSend);
    }

    function setupWelcomeChips() {
        document.querySelectorAll('.welcome-chip').forEach(c => c.addEventListener('click', () => {
            document.getElementById('chat-input').value = c.dataset.prompt; handleSend();
        }));
    }

    async function handleSend() {
        const input = document.getElementById('chat-input'), text = input.value.trim();
        if (!text || isProcessing) return;
        document.querySelector('.welcome-screen').style.display = 'none';
        const ma = document.querySelector('.messages-area'); ma.style.display = 'flex';
        addMessage('user', text);
        input.value = ''; input.style.height = 'auto'; document.getElementById('send-btn').disabled = true;
        showTyping(true); isProcessing = true;

        try {
            const msgEl = addMessage('nexus', '', true);
            const bubble = msgEl.querySelector('.message-bubble');
            let full = '';
            for await (const chunk of Nexus.stream('chat', text)) {
                full += chunk; bubble.innerHTML = renderMd(full); scrollBottom();
            }
            bubble.innerHTML = renderMd(full); addCopyBtns(bubble); addActions(msgEl, full);
            scrollBottom(); Voice.speak(full); saveCurrent(); updateHistory();
        } catch (err) {
            addMessage('nexus', '⚠️ ' + err.message); Toast.show(err.message, 'error');
        } finally { showTyping(false); isProcessing = false; }
    }

    function addMessage(role, text, streaming = false) {
        const ma = document.querySelector('.messages-area'), msg = document.createElement('div');
        msg.className = `message ${role}-message`;
        const time = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
        const name = localStorage.getItem('nexus_student_name') || 'You';
        if (role === 'nexus') {
            msg.innerHTML = `<div class="message-avatar"><img src="assets/logo.png" alt="N"></div><div class="message-content"><span class="message-sender">Nexus</span><div class="message-bubble">${streaming?'':renderMd(text)}</div><span class="message-time">${time}</span>${streaming?'':'<div class="message-actions"></div>'}</div>`;
        } else {
            msg.innerHTML = `<div class="message-avatar">${name.charAt(0).toUpperCase()}</div><div class="message-content"><span class="message-sender">${esc(name)}</span><div class="message-bubble">${esc(text)}</div><span class="message-time">${time}</span></div>`;
        }
        ma.appendChild(msg);
        if (!streaming && role==='nexus' && text) { addCopyBtns(msg.querySelector('.message-bubble')); addActions(msg, text); }
        scrollBottom(); return msg;
    }

    function addActions(el, text) {
        const a = el.querySelector('.message-actions'); if (!a) return;
        a.innerHTML = `<button class="msg-action-btn" data-a="copy">📋 Copy</button><button class="msg-action-btn" data-a="speak">🔊 Read</button>`;
        a.querySelectorAll('.msg-action-btn').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.a==='copy') { navigator.clipboard.writeText(text); b.textContent='✓ Copied'; setTimeout(()=>b.textContent='📋 Copy',2000); }
            else { Voice.stopSpeaking(); const o=localStorage.getItem('nexus_auto_speak'); localStorage.setItem('nexus_auto_speak','true'); Voice.speak(text); if(o!==null)localStorage.setItem('nexus_auto_speak',o);else localStorage.removeItem('nexus_auto_speak'); }
        }));
    }

    function addCopyBtns(b) {
        b.querySelectorAll('pre').forEach(p => { if(p.querySelector('.code-copy-btn'))return; const btn=document.createElement('button'); btn.className='code-copy-btn'; btn.textContent='Copy'; btn.onclick=()=>{navigator.clipboard.writeText(p.querySelector('code')?.textContent||p.textContent);btn.textContent='Copied!';setTimeout(()=>btn.textContent='Copy',2000);}; p.style.position='relative'; p.appendChild(btn); });
    }

    function showTyping(s) { document.querySelector('.typing-indicator')?.classList.toggle('active', s); if(s)scrollBottom(); }
    function scrollBottom() { const c=document.querySelector('.chat-container'); if(c)requestAnimationFrame(()=>c.scrollTop=c.scrollHeight); }

    function renderMd(t) {
        if(!t)return''; let h=esc(t);
        h=h.replace(/```(\w*)\n([\s\S]*?)```/g,(_,l,c)=>`<pre><code class="language-${l||'text'}">${c.trim()}</code></pre>`);
        h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
        h=h.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
        h=h.replace(/\*([^*]+)\*/g,'<em>$1</em>');
        h=h.replace(/^### (.+)$/gm,'<h3>$1</h3>');h=h.replace(/^## (.+)$/gm,'<h2>$1</h2>');h=h.replace(/^# (.+)$/gm,'<h1>$1</h1>');
        h=h.replace(/^&gt; (.+)$/gm,'<blockquote>$1</blockquote>');
        h=h.replace(/^[*-] (.+)$/gm,'<li>$1</li>');h=h.replace(/(<li>[\s\S]*?<\/li>(\n)?)+/g,'<ul>$&</ul>');
        h=h.replace(/^\d+\. (.+)$/gm,'<li>$1</li>');
        h=h.replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g,(m,hd,bd)=>{const hs=hd.split('|').map(x=>`<th>${x.trim()}</th>`).join('');const rs=bd.trim().split('\n').map(r=>'<tr>'+r.split('|').filter(Boolean).map(c=>`<td>${c.trim()}</td>`).join('')+'</tr>').join('');return `<table><thead><tr>${hs}</tr></thead><tbody>${rs}</tbody></table>`;});
        h=h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>');
        h=h.replace(/\n\n/g,'</p><p>');h=h.replace(/\n/g,'<br>');h='<p>'+h+'</p>';
        h=h.replace(/<p>\s*<\/p>/g,'');h=h.replace(/<p>\s*(<[huo])/g,'$1');h=h.replace(/(<\/[huo][l1-3]?>)\s*<\/p>/g,'$1');
        h=h.replace(/<p>\s*(<pre>)/g,'$1');h=h.replace(/(<\/pre>)\s*<\/p>/g,'$1');
        h=h.replace(/<p>\s*(<table>)/g,'$1');h=h.replace(/(<\/table>)\s*<\/p>/g,'$1');
        h=h.replace(/<p>\s*(<blockquote>)/g,'$1');h=h.replace(/(<\/blockquote>)\s*<\/p>/g,'$1');
        return h;
    }
    function esc(t){const d=document.createElement('div');d.textContent=t;return d.innerHTML;}

    function generateId(){return 'c_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);}
    function newChat(){currentChatId=generateId();Nexus.resetConversation('chat');const ma=document.querySelector('.messages-area');if(ma){ma.innerHTML='';ma.style.display='none';}document.querySelector('.welcome-screen').style.display='flex';document.getElementById('chat-input').value='';updateHistory();Voice.stopSpeaking();Settings.updateWelcomeName();}
    function saveCurrent(){if(!currentChatId)currentChatId=generateId();const ma=document.querySelector('.messages-area');const msgs=[];ma.querySelectorAll('.message').forEach(m=>{const r=m.classList.contains('user-message')?'user':'nexus';msgs.push({role:r,text:m.querySelector('.message-bubble').textContent,html:m.querySelector('.message-bubble').innerHTML,time:m.querySelector('.message-time')?.textContent||''});});if(!msgs.length)return;const c=JSON.parse(localStorage.getItem('nexus_chats')||'{}');c[currentChatId]={id:currentChatId,title:msgs[0]?.text?.slice(0,50)||'Chat',messages:msgs,conversation:Nexus.getConversation('chat'),updatedAt:Date.now()};localStorage.setItem('nexus_chats',JSON.stringify(c));}
    function loadChat(id){const c=JSON.parse(localStorage.getItem('nexus_chats')||'{}')[id];if(!c)return;currentChatId=id;Nexus.resetConversation('chat');if(c.conversation)c.conversation.forEach(m=>Nexus.getConversation('chat').push(m));document.querySelector('.welcome-screen').style.display='none';const ma=document.querySelector('.messages-area');ma.style.display='flex';ma.innerHTML='';const n=localStorage.getItem('nexus_student_name')||'You';c.messages.forEach(m=>{const el=document.createElement('div');el.className=`message ${m.role}-message`;if(m.role==='nexus'){el.innerHTML=`<div class="message-avatar"><img src="assets/logo.png" alt="N"></div><div class="message-content"><span class="message-sender">Nexus</span><div class="message-bubble">${m.html}</div><span class="message-time">${m.time}</span><div class="message-actions"></div></div>`;ma.appendChild(el);addCopyBtns(el.querySelector('.message-bubble'));addActions(el,m.text);}else{el.innerHTML=`<div class="message-avatar">${n.charAt(0).toUpperCase()}</div><div class="message-content"><span class="message-sender">${esc(n)}</span><div class="message-bubble">${m.html}</div><span class="message-time">${m.time}</span></div>`;ma.appendChild(el);}});scrollBottom();updateHistory();}
    function loadCurrentChat(){currentChatId=generateId();updateHistory();}
    function deleteChat(id){const c=JSON.parse(localStorage.getItem('nexus_chats')||'{}');delete c[id];localStorage.setItem('nexus_chats',JSON.stringify(c));if(id===currentChatId)newChat();updateHistory();}
    function clearAllChats(){localStorage.removeItem('nexus_chats');Nexus.resetConversation('chat');newChat();}
    function updateHistory(){const ct=document.querySelector('.chat-history');if(!ct)return;const c=JSON.parse(localStorage.getItem('nexus_chats')||'{}');const s=Object.values(c).sort((a,b)=>b.updatedAt-a.updatedAt);ct.innerHTML='<div class="chat-history-title">Recent</div>';if(!s.length){ct.innerHTML+='<div style="padding:16px;text-align:center;color:var(--text-tertiary);font-size:.78rem">No chats yet</div>';return;}s.forEach(ch=>{const it=document.createElement('div');it.className=`history-item ${ch.id===currentChatId?'active':''}`;it.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>${esc(ch.title)}</span><button class="delete-chat" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`;it.addEventListener('click',e=>{if(!e.target.closest('.delete-chat')){Router.go('chat');loadChat(ch.id);}});it.querySelector('.delete-chat').addEventListener('click',e=>{e.stopPropagation();deleteChat(ch.id);});ct.appendChild(it);});}
    function exportChat(){const ma=document.querySelector('.messages-area');if(!ma)return;let t='=== NEXUS Chat Export ===\nDate: '+new Date().toLocaleString()+'\n\n';ma.querySelectorAll('.message').forEach(m=>{const r=m.classList.contains('user-message')?'You':'Nexus';t+=`[${m.querySelector('.message-time')?.textContent||''}] ${r}:\n${m.querySelector('.message-bubble').textContent}\n\n`;});const b=new Blob([t],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`nexus-${new Date().toISOString().slice(0,10)}.txt`;a.click();URL.revokeObjectURL(u);Toast.show('Chat exported!','success');}

    return {init,handleSend,newChat,deleteChat,clearAllChats,updateHistoryList:updateHistory,exportChat,addMessage,scrollToBottom:scrollBottom};
})();
