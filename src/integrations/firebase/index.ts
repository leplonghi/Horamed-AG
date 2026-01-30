// Firebase client
export { default as app, auth, db, storage, functions, analytics } from './client'

// Authentication
export {
    useAuth,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    getCurrentUser,
    getIdToken,
} from './auth'

// Firestore
export {
    useDocument,
    useCollection,
    useUserCollection,
    setDocument,
    updateDocument,
    deleteDocument,
    addDocument,
    fetchDocument,
    fetchCollection,
    fetchCollectionGroup,
    timestampToDate,
    where,
    orderBy,
    limit,
    serverTimestamp,
    query,
} from './firestore'

// Re-export Firebase types for convenience
export type { User } from 'firebase/auth'
export type { DocumentData, Timestamp } from 'firebase/firestore'
export { httpsCallable } from 'firebase/functions'
