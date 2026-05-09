/* NEXUS v3.0 — Firebase Configuration */
const firebaseConfig = {
    apiKey: "AIzaSyDmo4kKAisQN1qqkyalQaV5hkdVpaG8cbw",
    authDomain: "nexus-ai-3336c.firebaseapp.com",
    projectId: "nexus-ai-3336c",
    storageBucket: "nexus-ai-3336c.firebasestorage.app",
    messagingSenderId: "396868236732",
    appId: "1:396868236732:web:0ab55e1968e663a7e427b9",
    measurementId: "G-EF3340B8RX"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for Firestore
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.log('Firestore persistence:', err.code);
});

// Auth helper
const Auth = (() => {
    function getCurrentUser() { return auth.currentUser; }
    function getUID() { return auth.currentUser?.uid || null; }
    function isLoggedIn() { return !!auth.currentUser; }

    async function signUpEmail(email, password, displayName) {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName });
        // Create user doc in Firestore
        await db.collection('users').doc(cred.user.uid).set({
            displayName,
            email,
            photoURL: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            xp: 0, streak: 0, lastVisit: null,
            level: 'College Student',
            interests: [],
            settings: { theme: 'dark', accent: '#4a6cf7', lang: 'en', fontSize: 'medium' }
        });
        return cred.user;
    }

    async function loginEmail(email, password) {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        return cred.user;
    }

    async function loginGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        const cred = await auth.signInWithPopup(provider);
        // Create user doc if first time
        const doc = await db.collection('users').doc(cred.user.uid).get();
        if (!doc.exists) {
            await db.collection('users').doc(cred.user.uid).set({
                displayName: cred.user.displayName || 'User',
                email: cred.user.email,
                photoURL: cred.user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                xp: 0, streak: 0, lastVisit: null,
                level: 'College Student',
                interests: [],
                settings: { theme: 'dark', accent: '#4a6cf7', lang: 'en', fontSize: 'medium' }
            });
        }
        return cred.user;
    }

    async function loginGithub() {
        const provider = new firebase.auth.GithubAuthProvider();
        const cred = await auth.signInWithPopup(provider);
        const doc = await db.collection('users').doc(cred.user.uid).get();
        if (!doc.exists) {
            await db.collection('users').doc(cred.user.uid).set({
                displayName: cred.user.displayName || 'User',
                email: cred.user.email,
                photoURL: cred.user.photoURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                xp: 0, streak: 0, lastVisit: null,
                level: 'College Student',
                interests: [],
                settings: { theme: 'dark', accent: '#4a6cf7', lang: 'en', fontSize: 'medium' }
            });
        }
        return cred.user;
    }

    async function resetPassword(email) {
        await auth.sendPasswordResetEmail(email);
    }

    async function logout() {
        await auth.signOut();
        window.location.href = 'login.html';
    }

    function onAuthChange(callback) {
        auth.onAuthStateChanged(callback);
    }

    return { getCurrentUser, getUID, isLoggedIn, signUpEmail, loginEmail, loginGoogle, loginGithub, resetPassword, logout, onAuthChange };
})();
