import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signInWithCredential,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
    indexedDBLocalPersistence,
    getAdditionalUserInfo,
} from 'firebase/auth'
import { auth } from './client'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'

// On Capacitor native (Android/iOS), use indexedDB persistence (more reliable in WebView).
// On web, use localStorage persistence with session/memory fallback if access is denied.
const isNativePlatform = Capacitor.isNativePlatform();

const trySetPersistence = async () => {
    try {
        await setPersistence(auth, isNativePlatform ? indexedDBLocalPersistence : browserLocalPersistence);
    } catch (err: any) {
        // If localStorage is blocked (common with third-party cookie blocking), fallback to session
        if (err.message?.includes('localStorage') || err.code?.includes('persistence')) {
            console.warn('⚠️ Local auth persistence denied (storage blocked). Falling back to session persistence...');
            try {
                await setPersistence(auth, browserSessionPersistence);
            } catch (err2) {
                await setPersistence(auth, inMemoryPersistence).catch(console.error);
            }
        } else {
            console.error('Failed to set auth persistence:', err);
        }
    }
};

trySetPersistence();

function isNoCredentialAvailableError(error: unknown) {
    if (!error || typeof error !== 'object') return false

    const message = 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : ''

    return (
        message.includes('nocredentialexception') ||
        message.includes('no credential available') ||
        message.includes('no credentials available')
    )
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return { user: result.user, error: null }
    } catch (error: any) {
        return { user: null, error }
    }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, displayName?: string) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password)

        // Update profile with display name if provided
        if (displayName && result.user) {
            await updateProfile(result.user, { displayName })
        }

        return { user: result.user, error: null }
    } catch (error: any) {
        return { user: null, error }
    }
}

/**
 * Sign in with Google
 *
 * Strategy:
 * - Capacitor native (Android/iOS): uses @capacitor-firebase/authentication which calls
 *   the native Android Google Sign-In SDK directly.
 * - Web/PWA on mobile browser: use signInWithRedirect (standard mobile web flow).
 * - Web/PWA on desktop: use signInWithPopup.
 */
export async function signInWithGoogle(options?: { prompt?: string, login_hint?: string }) {
    try {
        if (Capacitor.isNativePlatform()) {
            const customParameters: { key: string; value: string }[] = []
            if (options?.prompt) customParameters.push({ key: 'prompt', value: options.prompt })
            if (options?.login_hint) customParameters.push({ key: 'login_hint', value: options.login_hint })

            const nativeOptions = customParameters.length > 0 ? { customParameters } : {}
            let nativeResult

            try {
                // Try standard native sign in
                nativeResult = await FirebaseAuthentication.signInWithGoogle(nativeOptions)
            } catch (error) {
                const shouldFallbackToLegacyGoogleSignIn =
                    Capacitor.getPlatform() === 'android' && isNoCredentialAvailableError(error)

                if (!shouldFallbackToLegacyGoogleSignIn) {
                    throw error
                }

                // Fallback for older Android environments or missing Credential Manager
                nativeResult = await FirebaseAuthentication.signInWithGoogle({
                    ...nativeOptions,
                    useCredentialManager: false,
                })
            }

            const idToken = nativeResult.credential?.idToken
            if (!idToken) {
                throw new Error('Native Google Sign-In did not return an idToken')
            }

            // Exchange the native idToken for a Firebase JS SDK credential
            const credential = GoogleAuthProvider.credential(idToken)
            const userCredential = await signInWithCredential(auth, credential)
            const additionalInfo = getAdditionalUserInfo(userCredential)

            return {
                user: userCredential.user,
                isNewUser: additionalInfo?.isNewUser ?? false,
                error: null,
            }
        }

        // Web/PWA context
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({
            prompt: 'select_account',
            ...options,
        })

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

        if (isMobile) {
            // Mobile browser: redirect flow is more reliable
            await signInWithRedirect(auth, provider)
            return { user: null, isNewUser: false, error: null }
        } else {
            const result = await signInWithPopup(auth, provider)
            const additionalInfo = getAdditionalUserInfo(result)
            return {
                user: result.user,
                isNewUser: additionalInfo?.isNewUser ?? false,
                error: null,
            }
        }
    } catch (error: any) {
        console.error('Google Sign-In Error:', error);
        return { user: null, isNewUser: false, error }
    }
}

/**
 * Sign out
 */
export async function signOut() {
    try {
        if (Capacitor.isNativePlatform()) {
            await FirebaseAuthentication.signOut().catch(() => {})
        }
        await firebaseSignOut(auth)
        return { error: null }
    } catch (error: any) {
        return { error }
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    try {
        await sendPasswordResetEmail(auth, email)
        return { error: null }
    } catch (error: any) {
        return { error }
    }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser
}

/**
 * Get ID token
 */
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null

    try {
        return await user.getIdToken()
    } catch (error) {
        console.error('Error getting ID token:', error)
        return null
    }
}
