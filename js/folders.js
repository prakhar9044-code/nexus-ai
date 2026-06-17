/* NEXUS — Chat Folders (Phase 11)
   Organize conversations into custom folders in sidebar
*/
const Folders = (() => {
    let initialized = false;
    let folders = JSON.parse(localStorage.getItem('nexus_folders') || 'null') || [
        { id: 'study', name: '📚 Study', chats: [] },
        { id: 'career', name: '💼 Career', chats: [] },
        { id: 'code', name: '💻 Code', chats: [] },
        { id: 'general', name: '📋 General', chats: [] }
    ];
    let collapsed = JSON.parse(localStorage.getItem('nexus_folders_collapsed') || '{}');

    const style = document.createElement('style');
    style.textContent = `
    .folder-section{margin-top:8px;border-top:1px solid var(--border);padding-top:4px}
    .folder-header{display:flex;align-items:center;gap:6px;padding:8px 12px;cursor:pointer;font-size:0.75rem;font-weight:700;color:var(--text-secondary);transition:all 0.15s;user-select:none}
    .folder-header:hover{color:var(--text-primary);background:var(--bg-hover);border-radius:8px}
    .folder-arrow{font-size:0.6rem;transition:transform 0.2s;color:var(--text-tertiary)}
    .folder-arrow.collapsed{transform:rotate(-90deg)}
    .folder-name{flex:1}
    .folder-count{font-size:0.65rem;color:var(--text-tertiary);background:var(--bg-tertiary);padding:1px 6px;border-radius:8px}
    .folder-chats{overflow:hidden;transition:max-height 0.3s ease}
    .folder-chats.collapsed{max-height:0!important}
    .folder-actions{display:flex;gap:2px}
    .folder-action-btn{background:none;border:none;font-size:0.7rem;cursor:pointer;padding:2px 4px;border-radius:4px;color:var(--text-tertiary);transition:all 0.15s;opacity:0}
    .folder-header:hover .folder-action-btn{opacity:1}
    .folder-action-btn:hover{color:var(--accent);background:var(--bg-hover)}
    .folder-assign{position:fixed;z-index:9600;background:var(--bg-primary);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.3);min-width:180px;padding:6px;display:none}
    .folder-assign.active{display:block}
    .folder-assign-item{padding:8px 12px;font-size:0.78rem;cursor:pointer;border-radius:8px;transition:background 0.15s;display:flex;align-items:center;gap:6px}
    .folder-assign-item:hover{background:var(--bg-hover)}
    .folder-assign-item.active{color:var(--accent);font-weight:600}
    .folder-assign-title{font-size:0.68rem;font-weight:700;color:var(--text-tertiary);padding:6px 12px;text-transform:uppercase;letter-spacing:0.5px}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        save();
        injectFolderUI();
        createAssignMenu();
        console.log('[Folders] Initialized');
    }

    function save() {
        localStorage.setItem('nexus_folders', JSON.stringify(folders));
        localStorage.setItem('nexus_folders_collapsed', JSON.stringify(collapsed));
    }

    function injectFolderUI() {
        // Watch for sidebar history updates and re-render
        const observer = new MutationObserver(() => renderFolders());
        const historyEl = document.querySelector('.chat-history');
        if (historyEl) observer.observe(historyEl, { childList: true, subtree: true });
        setTimeout(renderFolders, 500);
    }

    function renderFolders() {
        const historyEl = document.querySelector('.chat-history');
        if (!historyEl) return;

        // Remove old folder sections
        historyEl.querySelectorAll('.folder-section').forEach(el => el.remove());

        // Get all history items
        const items = Array.from(historyEl.querySelectorAll('.history-item'));
        const chats = JSON.parse(localStorage.getItem('nexus_chats') || '{}');
        
        // Build assigned set
        const assigned = new Set();
        folders.forEach(f => f.chats.forEach(id => assigned.add(id)));

        // Add right-click to assign
        items.forEach(item => {
            if (item.dataset.folderBound) return;
            item.dataset.folderBound = '1';
            item.addEventListener('contextmenu', e => {
                e.preventDefault();
                const chatTitle = item.querySelector('span')?.textContent || '';
                // Find chat ID from chats by matching title
                const chatId = Object.entries(chats).find(([id, c]) => c.title === chatTitle)?.[0];
                if (chatId) showAssignMenu(e.clientX, e.clientY, chatId);
            });
        });

        // Create folder sections at bottom
        folders.forEach(folder => {
            if (!folder.chats.length) return;
            const section = document.createElement('div');
            section.className = 'folder-section';
            const isCollapsed = collapsed[folder.id];
            section.innerHTML = `
                <div class="folder-header" data-folder="${folder.id}">
                    <span class="folder-arrow ${isCollapsed ? 'collapsed' : ''}">▼</span>
                    <span class="folder-name">${folder.name}</span>
                    <span class="folder-count">${folder.chats.length}</span>
                    <div class="folder-actions">
                        <button class="folder-action-btn" data-action="rename" title="Rename">✏️</button>
                    </div>
                </div>
                <div class="folder-chats ${isCollapsed ? 'collapsed' : ''}" style="max-height:${isCollapsed ? '0' : folder.chats.length * 50}px">
                </div>
            `;

            // Move matching history items into folder
            const chatsContainer = section.querySelector('.folder-chats');
            folder.chats.forEach(chatId => {
                const chat = chats[chatId];
                if (!chat) return;
                const matchItem = items.find(it => {
                    const title = it.querySelector('span')?.textContent;
                    return title === chat.title;
                });
                if (matchItem) {
                    const clone = matchItem.cloneNode(true);
                    chatsContainer.appendChild(clone);
                }
            });

            // Toggle collapse
            section.querySelector('.folder-header').addEventListener('click', e => {
                if (e.target.closest('.folder-action-btn')) return;
                collapsed[folder.id] = !collapsed[folder.id];
                save();
                const arrow = section.querySelector('.folder-arrow');
                const container = section.querySelector('.folder-chats');
                arrow.classList.toggle('collapsed');
                container.classList.toggle('collapsed');
                if (!container.classList.contains('collapsed')) {
                    container.style.maxHeight = folder.chats.length * 50 + 'px';
                }
            });

            // Rename
            section.querySelector('[data-action="rename"]')?.addEventListener('click', e => {
                e.stopPropagation();
                const newName = prompt('Rename folder:', folder.name);
                if (newName && newName.trim()) {
                    folder.name = newName.trim();
                    save();
                    renderFolders();
                }
            });

            historyEl.appendChild(section);
        });
    }

    function createAssignMenu() {
        const menu = document.createElement('div');
        menu.className = 'folder-assign';
        menu.id = 'folder-assign-menu';
        document.body.appendChild(menu);

        document.addEventListener('click', () => {
            menu.classList.remove('active');
        });
    }

    function showAssignMenu(x, y, chatId) {
        const menu = document.getElementById('folder-assign-menu');
        if (!menu) return;

        menu.innerHTML = `<div class="folder-assign-title">Move to folder</div>` +
            folders.map(f => {
                const inFolder = f.chats.includes(chatId);
                return `<div class="folder-assign-item ${inFolder ? 'active' : ''}" data-folder="${f.id}" data-chat="${chatId}">
                    ${inFolder ? '✓ ' : ''}${f.name}
                </div>`;
            }).join('') +
            `<div class="folder-assign-item" data-action="new" data-chat="${chatId}" style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px">➕ New Folder</div>`;

        menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
        menu.style.top = Math.min(y, window.innerHeight - 300) + 'px';
        menu.classList.add('active');

        menu.querySelectorAll('.folder-assign-item').forEach(item => {
            item.addEventListener('click', e => {
                e.stopPropagation();
                if (item.dataset.action === 'new') {
                    const name = prompt('New folder name:');
                    if (name && name.trim()) {
                        const newFolder = { id: 'f_' + Date.now(), name: name.trim(), chats: [chatId] };
                        // Remove from other folders
                        folders.forEach(f => { f.chats = f.chats.filter(id => id !== chatId); });
                        folders.push(newFolder);
                        save();
                        renderFolders();
                        Toast.show('📁 Folder created!', 'success');
                    }
                } else {
                    const folderId = item.dataset.folder;
                    const folder = folders.find(f => f.id === folderId);
                    if (folder) {
                        // Remove from all folders first
                        folders.forEach(f => { f.chats = f.chats.filter(id => id !== chatId); });
                        // Add to target
                        if (!item.classList.contains('active')) {
                            folder.chats.push(chatId);
                            Toast.show(`Moved to ${folder.name}`, 'success');
                        } else {
                            Toast.show('Removed from folder', 'info');
                        }
                        save();
                        renderFolders();
                    }
                }
                menu.classList.remove('active');
            });
        });
    }

    function addToFolder(chatId, folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (folder && !folder.chats.includes(chatId)) {
            folder.chats.push(chatId);
            save();
        }
    }

    return { init, addToFolder, renderFolders };
})();
