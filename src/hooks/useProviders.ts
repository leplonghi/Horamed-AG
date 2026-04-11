/**
 * useProviders — Hook for managing personal health providers
 *
 * Provides:
 *  - providers list (sorted: favorites first, then alphabetical)
 *  - CRUD operations
 *  - Loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import type { HealthProvider } from '@/types/healthProvider';
import {
  fetchProviders,
  addProvider,
  updateProvider,
  deleteProvider,
  toggleProviderFavorite,
} from '@/services/ProviderService';

interface UseProvidersReturn {
  providers:       HealthProvider[];
  loading:         boolean;
  error:           string | null;
  reload:          () => Promise<void>;
  add:             (p: Omit<HealthProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  update:          (id: string, changes: Partial<HealthProvider>) => Promise<boolean>;
  remove:          (id: string) => Promise<boolean>;
  toggleFavorite:  (id: string) => Promise<void>;
}

export function useProviders(): UseProvidersReturn {
  const [providers, setProviders] = useState<HealthProvider[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProviders();
      setProviders(data);
    } catch (err) {
      console.error('[useProviders] reload:', err);
      setError('Não foi possível carregar os provedores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (provider: Omit<HealthProvider, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const { id, error: err } = await addProvider(provider);
      if (err) {
        console.error('[useProviders] add:', err);
        return null;
      }
      await reload();
      return id;
    },
    [reload]
  );

  const update = useCallback(
    async (id: string, changes: Partial<HealthProvider>) => {
      const { error: err } = await updateProvider(id, changes);
      if (err) {
        console.error('[useProviders] update:', err);
        return false;
      }
      setProviders(prev =>
        prev.map(p => (p.id === id ? { ...p, ...changes, updatedAt: new Date().toISOString() } : p))
      );
      return true;
    },
    []
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await deleteProvider(id);
      if (err) {
        console.error('[useProviders] remove:', err);
        return false;
      }
      setProviders(prev => prev.filter(p => p.id !== id));
      return true;
    },
    []
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const provider = providers.find(p => p.id === id);
      if (!provider) return;
      await toggleProviderFavorite(id, provider.isFavorite);
      setProviders(prev =>
        prev.map(p => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
      );
    },
    [providers]
  );

  return { providers, loading, error, reload, add, update, remove, toggleFavorite };
}
