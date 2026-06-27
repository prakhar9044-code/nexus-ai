/* NEXUS — Scroll-to-Bottom FAB (Phase 13)
   Floating button that appears when scrolled up from bottom
*/
const ScrollFab = (() => {
    let initialized = false;
    let fabEl = null;

    const style = document.createElement('style');
    style.textContent = `
    .scroll-fab{position:fixed;bottom:100px;right:24px;width:42px;height:42px;border-radius:50%;background:var(--accent);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(74,108,247,0.4);z-index:500;opacity:0;visibility:hidden;transform:scale(0.7) translateY(10px);transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1)}
    .scroll-fab.visible{opacity:1;visibility:visible;transform:scale(1) translateY(0)}
    .scroll-fab:hover{transform:scale(1.08) translateY(-2px);box-shadow:0 6px 28px rgba(74,108,247,0.5)}
    .scroll-fab:active{transform:scale(0.95)}
    .scroll-fab svg{width:18px;height:18px}
    .scroll-fab-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#f7768e;color:#fff;font-size:0.6rem;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 2px 6px rgba(247,118,142,0.4)}
    @media(max-width:768px){.scroll-fab{bottom:85px;right:16px;width:38px;height:38px}}
    `;
    document.head.appendChild(style);

    function init() {
        if (initialized) return;
        initialized = true;
        createFab();
        watchScroll();
        console.log('[ScrollFab] Initialized');
    }

    function createFab() {
        fabEl = document.createElement('button');
        fabEl.className = 'scroll-fab';
        fabEl.id = 'scroll-fab';
        fabEl.title = 'Scroll to bottom';
        fabEl.setAttribute('aria-label', 'Scroll to bottom');
        fabEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        `;
        document.body.appendChild(fabEl);

        fabEl.addEventListener('click', () => {
            const area = document.querySelector('.messages-area');
            if (area) {
                area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
            }
            fabEl.classList.remove('visible');
        });
    }

    let newMsgCount = 0;

    function watchScroll() {
        setTimeout(() => {
            const area = document.querySelector('.messages-area');
            if (!area) return;

            area.addEventListener('scroll', () => {
                const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
                if (distFromBottom > 150) {
                    fabEl.classList.add('visible');
                } else {
                    fabEl.classList.remove('visible');
                    newMsgCount = 0;
                    updateBadge();
                }
            });

            // Track new messages while scrolled up
            const observer = new MutationObserver(mutations => {
                const distFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
                if (distFromBottom > 150) {
                    mutations.forEach(m => {
                        m.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && node.classList?.contains('message')) {
                                newMsgCount++;
                                updateBadge();
                                fabEl.classList.add('visible');
                            }
                        });
                    });
                }
            });
            observer.observe(area, { childList: true });
        }, 1500);
    }

    function updateBadge() {
        if (!fabEl) return;
        let badge = fabEl.querySelector('.scroll-fab-badge');
        if (newMsgCount > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'scroll-fab-badge';
                fabEl.appendChild(badge);
            }
            badge.textContent = newMsgCount > 9 ? '9+' : newMsgCount;
        } else {
            badge?.remove();
        }
    }

    return { init };
})();
