import { useEffect, useState } from 'react'
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
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
} from 'firebase/auth'
import { auth } from './client'

// Set persistence to local as early as possible
setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error('Failed to set auth persistence:', err);
});

export interface AuthState {
    user: User | null
    loading: boolean
    error: Error | null
}

/**
 * Hook to get current auth state and handle redirect results
 */
export function useAuth(): AuthState {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        // Handle redirect result (useful for mobile browsers where popup might fail)
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                setUser(result.user)
            }
        }).catch((err) => {
            console.error('Auth redirect error:', err);
            // This is likely the "missing initial state" error seen in the user's screenshot
            if (err.code === 'auth/missing-initial-state' || err.code === 'auth/internal-error') {
                setError(err);
            }
        });

        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                setUser(user)
                setLoading(false)
            },
            (err) => {
                setError(err)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [])

    return { user, loading, error }
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
 */
export async function signInWithGoogle(options?: { prompt?: string, login_hint?: string }) {
    try {
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({
            prompt: 'select_account',
            ...options
        })

        // Detect if mobile browser
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // For mobile, redirect is usually more reliable than popup
            await signInWithRedirect(auth, provider)
            return { user: null, error: null } // User will be redirected
        } else {
            const result = await signInWithPopup(auth, provider)
            return { user: result.user, error: null }
        }
    } catch (error: any) {
        return { user: null, error }
    }
}

/**
 * Sign out
 */
export async function signOut() {
    try {
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

