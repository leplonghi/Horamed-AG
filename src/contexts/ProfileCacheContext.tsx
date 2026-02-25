import React, { createContext, useContext } from 'react';
import { useProfileCache } from '@/hooks/useProfileCache';

interface MinimalProfile {
  id: string;
  [key: string]: unknown;
}

type FirestoreDoc = Record<string, unknown>;

interface ProfileCache {
  medications: FirestoreDoc[];
  todayDoses: FirestoreDoc[];
  documents: FirestoreDoc[];
  vitalSigns: FirestoreDoc[];
  consultations: FirestoreDoc[];
  healthEvents: FirestoreDoc[];
  lastUpdated: number;
}

interface CacheStore {
  [profileId: string]: ProfileCache;
}

interface ProfileCacheContextType {
  cache: CacheStore;
  prefetchProfileData: (profileId: string, userId: string) => Promise<void>;
  prefetchAllProfiles: (profiles: MinimalProfile[], userId: string) => Promise<void>;
  getProfileCache: (profileId: string) => ProfileCache | null;
  invalidateProfileCache: (profileId: string) => void;
  invalidateAllCache: () => void;
  updateProfileCache: (profileId: string, updates: Partial<ProfileCache>) => void;
}

const ProfileCacheContext = createContext<ProfileCacheContextType | undefined>(undefined);

export function ProfileCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheHook = useProfileCache();

  return (
    <ProfileCacheContext.Provider value={cacheHook}>
      {children}
    </ProfileCacheContext.Provider>
  );
}

export function useProfileCacheContext() {
  const context = useContext(ProfileCacheContext);
  if (!context) {
    throw new Error('useProfileCacheContext must be used within ProfileCacheProvider');
  }
  return context;
}
