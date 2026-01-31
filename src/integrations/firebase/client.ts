import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'
import { getMessaging } from 'firebase/messaging'

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Only log in development (will be removed in production by terser)
if (import.meta.env.DEV) {
    console.log('🔥 Firebase Client Initialization', {
        mode: import.meta.env.MODE,
        isDev: import.meta.env.DEV,
        isProd: import.meta.env.PROD,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId,
        hasAppId: !!firebaseConfig.appId,
        projectId: firebaseConfig.projectId,
    });
}

// Validate config presence (use console.error - not removed in production)
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !Object.prototype.hasOwnProperty.call(firebaseConfig, key) || !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
    const errorMsg = `❌ Missing Firebase configuration keys: ${missingKeys.join(', ')}`;
    console.error(errorMsg);
    console.error('🔍 Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    throw new Error(errorMsg);
}

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    if (import.meta.env.DEV) {
        console.log('✅ Firebase app initialized successfully');
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase app:', error);
    throw error;
}

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app) // Default region: us-central1

// Initialize Analytics (only in production)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

// Initialize Messaging (only in browser environment)
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null

// Connect to emulators in development
if (import.meta.env.DEV) {
    // Uncomment to use emulators
    // connectAuthEmulator(auth, 'http://localhost:9099')
    // connectFirestoreEmulator(db, 'localhost', 8080)
    // connectStorageEmulator(storage, 'localhost', 9199)
    // connectFunctionsEmulator(functions, 'localhost', 5001)
}

export default app
