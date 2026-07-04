/* NEXUS — File Upload & Analysis Handler
   Supports drag-drop and file picker for chat.
   Handles text, CSV, JSON, PDF, and images.
*/
const FileHandler = (() => {
    let attachedFile = null;
    let initialized = false;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
    .file-upload-btn{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:8px;border-radius:var(--radius-sm);transition:all 0.2s;display:flex;align-items:center}
    .file-upload-btn:hover{color:var(--accent);background:var(--bg-hover)}
    .file-upload-btn svg{width:20px;height:20px}
    .file-drop-overlay{position:absolute;inset:0;background:rgba(74,108,247,0.08);border:2px dashed var(--accent);border-radius:var(--radius-md);display:none;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(4px)}
    .file-drop-overlay.active{display:flex}
    .file-drop-label{color:var(--accent);font-weight:600;font-size:1rem;padding:20px;text-align:center}
    .file-preview{display:flex;align-items:center;gap:10px;padding:8px 12px;margin:4px 12px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.82rem;animation:file-preview-in 0.3s ease}
    .file-preview-icon{font-size:1.4rem;flex-shrink:0}
    .file-preview-info{flex:1;min-width:0}
    .file-preview-name{color:var(--text-primary);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .file-preview-size{color:var(--text-tertiary);font-size:0.7rem}
    .file-preview-remove{background:none;border:none;color:var(--text-tertiary);cursor:pointer;padding:4px;font-size:1rem;border-radius:50%;transition:all 0.2s}
    .file-preview-remove:hover{color:var(--red);background:rgba(239,68,68,0.1)}
    .file-preview-img{width:48px;height:48px;border-radius:6px;object-fit:cover;border:1px solid var(--border)}
    .chat-file-card{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
    .chat-file-card-icon{font-size:1.5rem}
    .chat-file-card-name{font-weight:500;font-size:0.85rem}
    .chat-file-card-size{font-size:0.7rem;color:var(--text-tertiary)}
    @keyframes file-preview-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(style);

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED = {
        'text/plain': { icon: '📄', type: 'text' },
        'text/csv': { icon: '📊', type: 'text' },
        'application/json': { icon: '📋', type: 'text' },
        'application/pdf': { icon: '📕', type: 'pdf' },
        'image/png': { icon: '🖼️', type: 'image' },
        'image/jpeg': { icon: '🖼️', type: 'image' },
        'image/webp': { icon: '🖼️', type: 'image' },
    };

    function init() {
        if (initialized) return;
        initialized = true;

        const inputArea = document.querySelector('.input-area');
        if (!inputArea) return;

        // Use existing file input from HTML (app.js Attachment.init handles the click-to-open)
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            // Update accept attribute to include all supported types
            fileInput.accept = Object.keys(ALLOWED).join(',');
            // Add advanced processing on file select (drag-drop, preview, etc.)
            fileInput.addEventListener('change', e => {
                if (e.target.files[0]) processFile(e.target.files[0]);
            });
        }

        // Drag & drop on messages area
        const msgArea = document.querySelector('.messages-area') || document.querySelector('.chat-area');
        if (msgArea) {
            msgArea.style.position = 'relative';
            const dropOverlay = document.createElement('div');
            dropOverlay.className = 'file-drop-overlay';
            dropOverlay.innerHTML = '<div class="file-drop-label">📎 Drop file here to analyze</div>';
            msgArea.appendChild(dropOverlay);

            let dragCounter = 0;
            msgArea.addEventListener('dragenter', e => { e.preventDefault(); dragCounter++; dropOverlay.classList.add('active'); });
            msgArea.addEventListener('dragleave', e => { e.preventDefault(); dragCounter--; if (dragCounter <= 0) { dropOverlay.classList.remove('active'); dragCounter = 0; } });
            msgArea.addEventListener('dragover', e => e.preventDefault());
            msgArea.addEventListener('drop', e => {
                e.preventDefault();
                dropOverlay.classList.remove('active');
                dragCounter = 0;
                if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
            });
        }

        console.log('[FileHandler] Initialized');
    }

    function processFile(file) {
        if (file.size > MAX_SIZE) {
            if (typeof showToast === 'function') showToast('File too large (max 10MB)', 'error');
            return;
        }
        const meta = ALLOWED[file.type];
        if (!meta) {
            if (typeof showToast === 'function') showToast('Unsupported file type', 'error');
            return;
        }

        const reader = new FileReader();
        if (meta.type === 'image') {
            reader.onload = e => {
                attachedFile = {
                    name: file.name,
                    size: file.size,
                    type: 'image',
                    icon: meta.icon,
                    mimeType: file.type,
                    data: e.target.result, // base64 data URL
                    preview: e.target.result
                };
                showPreview();
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = e => {
                let content = e.target.result;
                if (content.length > 50000) content = content.substring(0, 50000) + '\n\n[...truncated]';
                attachedFile = {
                    name: file.name,
                    size: file.size,
                    type: meta.type,
                    icon: meta.icon,
                    mimeType: file.type,
                    data: content,
                    preview: null
                };
                showPreview();
            };
            reader.readAsText(file);
        }
    }

    function showPreview() {
        removePreview();
        if (!attachedFile) return;
        const inputArea = document.querySelector('.input-area');
        if (!inputArea) return;

        const preview = document.createElement('div');
        preview.className = 'file-preview';
        preview.id = 'file-preview';

        const sizeStr = attachedFile.size < 1024 ? attachedFile.size + ' B' :
            attachedFile.size < 1048576 ? (attachedFile.size / 1024).toFixed(1) + ' KB' :
            (attachedFile.size / 1048576).toFixed(1) + ' MB';

        let iconHTML = `<span class="file-preview-icon">${attachedFile.icon}</span>`;
        if (attachedFile.preview) {
            iconHTML = `<img class="file-preview-img" src="${attachedFile.preview}" alt="${attachedFile.name}">`;
        }

        preview.innerHTML = `
            ${iconHTML}
            <div class="file-preview-info">
                <div class="file-preview-name">${attachedFile.name}</div>
                <div class="file-preview-size">${sizeStr}</div>
            </div>
            <button class="file-preview-remove" title="Remove file">✕</button>
        `;
        preview.querySelector('.file-preview-remove').addEventListener('click', clearFile);
        inputArea.insertBefore(preview, inputArea.firstChild);
    }

    function removePreview() {
        const el = document.getElementById('file-preview');
        if (el) el.remove();
    }

    function getAttachedFile() { return attachedFile; }

    function clearFile() {
        attachedFile = null;
        removePreview();
    }

    function getContextPrompt() {
        if (!attachedFile) return null;
        if (attachedFile.type === 'image') {
            return { text: `[User attached an image: ${attachedFile.name}]\nPlease analyze this image.`, imageData: attachedFile.data };
        }
        return { text: `[User attached a file: ${attachedFile.name}]\n\nFile content:\n\`\`\`\n${attachedFile.data}\n\`\`\`\n\nPlease analyze this file content.` };
    }

    function renderChatCard() {
        if (!attachedFile) return '';
        const sizeStr = attachedFile.size < 1024 ? attachedFile.size + ' B' :
            attachedFile.size < 1048576 ? (attachedFile.size / 1024).toFixed(1) + ' KB' :
            (attachedFile.size / 1048576).toFixed(1) + ' MB';
        return `<div class="chat-file-card"><span class="chat-file-card-icon">${attachedFile.icon}</span><div><div class="chat-file-card-name">${attachedFile.name}</div><div class="chat-file-card-size">${sizeStr}</div></div></div>`;
    }

    return { init, getAttachedFile, clearFile, getContextPrompt, renderChatCard };
})();
