/* ============================================
   NEXUS — Preloader Logic (Elegant)
   ============================================ */
const Preloader = (() => {
    const messages = [
        'Preparing your workspace...',
        'Loading knowledge base...',
        'Setting up study tools...',
        'Almost ready...'
    ];
    let messageIndex = 0;

    function init() {
        createParticles();
        animateProgress();
        cycleMessages();
        document.getElementById('preloader-skip')?.addEventListener('click', finish);
    }

    function createParticles() {
        const container = document.querySelector('.preloader-particles');
        if (!container) return;
        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.cssText = `
                left: ${Math.random() * 100}%;
                width: ${2 + Math.random() * 3}px;
                height: ${2 + Math.random() * 3}px;
                animation-delay: ${Math.random() * 5}s;
                animation-duration: ${4 + Math.random() * 4}s;
            `;
            container.appendChild(p);
        }
    }

    function animateProgress() {
        const fill = document.querySelector('.progress-fill');
        if (!fill) return;
        const steps = [
            { target: 30, delay: 300 },
            { target: 60, delay: 800 },
            { target: 85, delay: 1500 },
            { target: 100, delay: 2200 }
        ];
        steps.forEach(s => {
            setTimeout(() => {
                fill.style.width = s.target + '%';
                if (s.target === 100) setTimeout(finish, 400);
            }, s.delay);
        });
    }

    function cycleMessages() {
        const el = document.querySelector('.preloader-message');
        if (!el) return;
        function show() {
            el.textContent = messages[messageIndex];
            el.style.opacity = '1';
            setTimeout(() => {
                el.style.opacity = '0.4';
                messageIndex = (messageIndex + 1) % messages.length;
                setTimeout(show, 150);
            }, 500);
        }
        show();
    }

    function finish() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('hidden');
            setTimeout(() => preloader.style.display = 'none', 600);
        }
        document.getElementById('app')?.classList.add('visible');
    }

    return { init, finish };
})();
