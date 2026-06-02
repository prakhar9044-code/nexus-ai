/* NEXUS — Global Error Handler
   Catches uncaught errors, shows user-friendly toasts,
   and logs critical errors to Firestore.
*/
const ErrorHandler = (() => {
    let errorCount = 0;
    let lastErrorReset = Date.now();
    const MAX_TOASTS_PER_MIN = 3;

    function init() {
        window.onerror = (msg, src, line, col, err) => {
            handleError(err || new Error(msg), `${src}:${line}:${col}`);
            return true;
        };
        window.addEventListener('unhandledrejection', e => {
            handleError(e.reason || new Error('Promise rejected'), 'unhandledrejection');
            e.preventDefault();
        });
        console.log('[ErrorHandler] Initialized');
    }

    function handleError(error, context) {
        const now = Date.now();
        if (now - lastErrorReset > 60000) { errorCount = 0; lastErrorReset = now; }
        errorCount++;
        console.error(`[Nexus Error] ${context}:`, error);
        if (errorCount <= MAX_TOASTS_PER_MIN && typeof showToast === 'function') {
            showToast('Something went wrong. Don\'t worry, we\'re on it!', 'error');
        }
        logToFirestore(error, context);
    }

    function logToFirestore(error, context) {
        try {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                firebase.firestore().collection('errors').add({
                    message: String(error?.message || error),
                    stack: error?.stack || '',
                    context: context,
                    url: location.href,
                    userAgent: navigator.userAgent,
                    time: new Date().toISOString(),
                    userId: firebase.auth?.()?.currentUser?.uid || 'anonymous'
                }).catch(() => {});
            }
        } catch {}
    }

    function report(error, context = 'manual') {
        handleError(error instanceof Error ? error : new Error(String(error)), context);
    }

    return { init, report };
})();
