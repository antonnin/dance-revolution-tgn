const firebaseConfig = {
    apiKey: 'AIzaSyCmg00aKp5J6aG8AyhaOf23TKnFEYGp9iI',
    authDomain: 'dance-revolution-tgn.firebaseapp.com',
    projectId: 'dance-revolution-tgn',
    appId: '1:1076024000408:web:745c9171801e27c68335ed',
};

export const firebaseConfigured = Object.values(firebaseConfig).every((value) => value.trim());
let app = null;
let authSdk = null;
let firestoreSdk = null;
let firebaseInitializationError = '';

if (firebaseConfigured) {
    try {
        const [appModule, authModule, firestoreModule] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
        ]);
        app = appModule.initializeApp(firebaseConfig);
        authSdk = authModule;
        firestoreSdk = firestoreModule;
    } catch (error) {
        firebaseInitializationError = error instanceof Error ? error.message : String(error);
    }
}

export { firebaseInitializationError };
export const auth = app ? authSdk.getAuth(app) : null;
export const db = app ? firestoreSdk.getFirestore(app) : null;
export const addDoc = firestoreSdk?.addDoc;
export const collection = firestoreSdk?.collection;
export const deleteDoc = firestoreSdk?.deleteDoc;
export const doc = firestoreSdk?.doc;
export const getDoc = firestoreSdk?.getDoc;
export const onSnapshot = firestoreSdk?.onSnapshot;
export const query = firestoreSdk?.query;
export const serverTimestamp = firestoreSdk?.serverTimestamp;
export const updateDoc = firestoreSdk?.updateDoc;
export const where = firestoreSdk?.where;
export const onAuthStateChanged = authSdk?.onAuthStateChanged;
export const signInWithEmailAndPassword = authSdk?.signInWithEmailAndPassword;
export const signOut = authSdk?.signOut;
