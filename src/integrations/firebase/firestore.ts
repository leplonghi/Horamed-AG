import { useEffect, useState } from 'react'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    QueryConstraint,
    DocumentData,
    Timestamp,
    serverTimestamp,
    WhereFilterOp,
} from 'firebase/firestore'
import { db } from './client'

/**
 * Hook to fetch a single document
 */
export function useDocument<T = DocumentData>(
    collectionName: string,
    documentId: string | null
) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!documentId) {
            setData(null)
            setLoading(false)
            return
        }

        const unsubscribe = onSnapshot(
            doc(db, collectionName, documentId),
            (snapshot) => {
                if (snapshot.exists()) {
                    setData({ id: snapshot.id, ...snapshot.data() } as T)
                } else {
                    setData(null)
                }
                setLoading(false)
            },
            (error) => {
                setError(error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [collectionName, documentId])

    return { data, loading, error }
}

/**
 * Hook to fetch a collection with real-time updates
 */
export function useCollection<T = DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = []
) {
    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const q = query(collection(db, collectionName), ...constraints)

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const items = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as T[]
                setData(items)
                setLoading(false)
            },
            (error) => {
                setError(error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [collectionName, JSON.stringify(constraints)])

    return { data, loading, error }
}

/**
 * Hook to fetch user's subcollection
 */
export function useUserCollection<T = DocumentData>(
    userId: string | null,
    subcollection: string,
    constraints: QueryConstraint[] = []
) {
    const [data, setData] = useState<T[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        if (!userId) {
            setData([])
            setLoading(false)
            return
        }

        const q = query(
            collection(db, 'users', userId, subcollection),
            ...constraints
        )

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const items = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as T[]
                setData(items)
                setLoading(false)
            },
            (error) => {
                setError(error)
                setLoading(false)
            }
        )

        return () => unsubscribe()
    }, [userId, subcollection, JSON.stringify(constraints)])

    return { data, loading, error }
}

/**
 * Add a new document to a collection with an auto-generated ID
 */
export async function addDocument<T = DocumentData>(
    collectionName: string,
    data: any
): Promise<{ data: T | null; error: Error | null }> {
    try {
        const { addDoc } = await import('firebase/firestore')
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        })
        return {
            data: { id: docRef.id, ...data } as unknown as T,
            error: null
        }
    } catch (error: any) {
        return { data: null, error }
    }
}

/**
 * Create or update a document
 */
export async function setDocument(
    collectionName: string,
    documentId: string,
    data: any,
    merge = true
) {
    try {
        const docRef = doc(db, collectionName, documentId)
        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge })
        return { error: null }
    } catch (error: any) {
        return { error }
    }
}

/**
 * Update a document
 */
export async function updateDocument(
    collectionName: string,
    documentId: string,
    data: any
) {
    try {
        const docRef = doc(db, collectionName, documentId)
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
        })
        return { error: null }
    } catch (error: any) {
        return { error }
    }
}

/**
 * Delete a document
 */
export async function deleteDocument(
    collectionName: string,
    documentId: string
) {
    try {
        await deleteDoc(doc(db, collectionName, documentId))
        return { error: null }
    } catch (error: any) {
        return { error }
    }
}

/**
 * Fetch a single document (one-time read)
 */
export async function fetchDocument<T = DocumentData>(
    collectionName: string,
    documentId: string
): Promise<{ data: T | null; error: Error | null }> {
    try {
        const snapshot = await getDoc(doc(db, collectionName, documentId))
        if (snapshot.exists()) {
            return {
                data: { id: snapshot.id, ...snapshot.data() } as T,
                error: null,
            }
        }
        return { data: null, error: null }
    } catch (error: any) {
        return { data: null, error }
    }
}

/**
 * Fetch a collection (one-time read)
 */
export async function fetchCollection<T = DocumentData>(
    collectionName: string,
    constraints: QueryConstraint[] = []
): Promise<{ data: T[]; error: Error | null }> {
    try {
        const q = query(collection(db, collectionName), ...constraints)
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as T[]
        return { data, error: null }
    } catch (error: any) {
        return { data: [], error }
    }
}

/**
 * Fetch a collection group (one-time read)
 */
export async function fetchCollectionGroup<T = DocumentData>(
    collectionId: string,
    constraints: QueryConstraint[] = []
): Promise<{ data: T[]; error: Error | null }> {
    try {
        const { collectionGroup } = await import('firebase/firestore')
        const q = query(collectionGroup(db, collectionId), ...constraints)
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as T[]
        return { data, error: null }
    } catch (error: any) {
        return { data: [], error }
    }
}

/**
 * Helper to convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | null): Date | null {
    return timestamp ? timestamp.toDate() : null
}

/**
 * Export query helpers for convenience
 */
export { where, orderBy, limit, serverTimestamp, query }
