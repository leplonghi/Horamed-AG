// Firebase client
export { default as app, auth, db, storage, functions, analytics } from './client'

// Authentication
export {
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
    fetchCount,
    fetchCollectionGroup,
    timestampToDate,
    where,
    orderBy,
    limit,
    serverTimestamp,
    query,
    Timestamp,
} from './firestore'

// Re-export Firebase types for convenience
export type { User } from 'firebase/auth'
export type { DocumentData } from 'firebase/firestore'
export { httpsCallable } from 'firebase/functions'
