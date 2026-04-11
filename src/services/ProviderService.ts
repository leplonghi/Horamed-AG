/**
 * Provider Service — Firestore CRUD for HealthProvider
 * Collection: users/{userId}/providers
 *
 * Data is strictly private per user. No cross-user data sharing.
 */

import { auth } from '@/integrations/firebase';
import {
  fetchCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  orderBy,
} from '@/integrations/firebase';
import type { HealthProvider } from '@/types/healthProvider';

const COLLECTION = (uid: string) => `users/${uid}/providers`;

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function fetchProviders(): Promise<HealthProvider[]> {
  const user = auth.currentUser;
  if (!user) return [];

  const { data, error } = await fetchCollection<HealthProvider>(
    COLLECTION(user.uid),
    [orderBy('isFavorite', 'desc'), orderBy('name', 'asc')]
  );

  if (error) {
    console.error('[ProviderService] fetchProviders:', error);
    return [];
  }

  return data ?? [];
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function addProvider(
  provider: Omit<HealthProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<{ id: string | null; error: unknown }> {
  const user = auth.currentUser;
  if (!user) return { id: null, error: new Error('Not authenticated') };

  const now = new Date().toISOString();
  const { id, error } = await addDocument(COLLECTION(user.uid), {
    ...provider,
    userId:    user.uid,
    createdAt: now,
    updatedAt: now,
  });

  return { id: id ?? null, error };
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateProvider(
  id: string,
  changes: Partial<Omit<HealthProvider, 'id' | 'userId' | 'createdAt'>>
): Promise<{ error: unknown }> {
  const user = auth.currentUser;
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await updateDocument(COLLECTION(user.uid), id, {
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  return { error };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteProvider(id: string): Promise<{ error: unknown }> {
  const user = auth.currentUser;
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await deleteDocument(COLLECTION(user.uid), id);
  return { error };
}

// ---------------------------------------------------------------------------
// Toggle Favorite
// ---------------------------------------------------------------------------

export async function toggleProviderFavorite(
  id: string,
  current: boolean
): Promise<{ error: unknown }> {
  return updateProvider(id, { isFavorite: !current });
}
