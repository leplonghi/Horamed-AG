import { useEffect, useState } from "react";
import { auth } from "@/integrations/firebase/client";
import { fetchCollection, addDocument, updateDocument, deleteDocument, where, orderBy } from "@/integrations/firebase";
import { toast } from "sonner";
import { useProfileCacheContext } from "@/contexts/ProfileCacheContext";

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  birthDate?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  gender?: string | null;
  bloodType?: string | null;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useUserProfiles() {
  // Initialize from localStorage immediately to avoid flash
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    try {
      const cached = localStorage.getItem('cachedProfiles');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem('cachedActiveProfile');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const [loading, setLoading] = useState(!profiles.length);
  const { prefetchAllProfiles } = useProfileCacheContext();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await fetchCollection<UserProfile>(
        `users/${user.uid}/profiles`,
        [orderBy('isPrimary', 'desc'), orderBy('name', 'asc')]
      );

      if (error) throw error;

      const profilesList = data || [];
      let newActiveProfile: UserProfile | null = null;

      if (profilesList.length === 0) {
        // Auto-create default profile for legacy/new users
        const defaultName = user.displayName || user.email?.split('@')[0] || 'Usuário';

        try {
          const { data: newProfile, error: createError } = await addDocument(`users/${user.uid}/profiles`, {
            userId: user.uid,
            name: defaultName,
            relationship: 'self',
            isPrimary: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          if (createError) throw createError;

          if (newProfile) {
            const createdProfile = { id: newProfile.id, ...newProfile } as UserProfile;
            profilesList.push(createdProfile);
            setProfiles(profilesList);
            localStorage.setItem('cachedProfiles', JSON.stringify(profilesList));

            newActiveProfile = createdProfile;
            setActiveProfile(newActiveProfile);
            localStorage.setItem('activeProfileId', newActiveProfile.id);
            localStorage.setItem('cachedActiveProfile', JSON.stringify(newActiveProfile));

            toast.success("Perfil principal criado automaticamente");
          }
        } catch {
          // Don't block loading
        }
      } else {
        setProfiles(profilesList);
        // Cache profiles in localStorage for instant load
        localStorage.setItem('cachedProfiles', JSON.stringify(profilesList));

        // Determine active profile
        const savedProfileId = localStorage.getItem('activeProfileId');

        if (savedProfileId && profilesList.length > 0) {
          newActiveProfile = profilesList.find(p => p.id === savedProfileId) || null;
        }

        if (!newActiveProfile && profilesList.length > 0) {
          newActiveProfile = profilesList.find(p => p.isPrimary) || profilesList[0];
        }

        if (newActiveProfile) {
          setActiveProfile(newActiveProfile);
          localStorage.setItem('activeProfileId', newActiveProfile.id);
          localStorage.setItem('cachedActiveProfile', JSON.stringify(newActiveProfile));
        }
      }

      // Prefetch in background - don't await
      if (profilesList.length > 0) {
        // We'll pass standard snake_case IDs if prefetch expects them, 
        // but here we just pass the list and uid
        prefetchAllProfiles(profilesList, user.uid).catch(() => { });
      }
    } catch {
      // Profile loading failed silently
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profile: Partial<UserProfile> & { name: string }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await addDocument(`users/${user.uid}/profiles`, {
        userId: user.uid,
        name: profile.name,
        avatarUrl: profile.avatarUrl || null,
        birthDate: profile.birthDate || null,
        relationship: profile.relationship || 'self',
        isPrimary: profile.isPrimary || false
      });

      if (error) throw error;

      await loadProfiles();
      toast.success('Perfil criado com sucesso');
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar perfil';
      toast.error(msg);
      throw error;
    }
  };

  const updateProfile = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { error } = await updateDocument(`users/${user.uid}/profiles`, id, updates);

      if (error) throw error;

      await loadProfiles();
      toast.success('Perfil atualizado');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      toast.error(msg);
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { error } = await deleteDocument(`users/${user.uid}/profiles`, id);

      if (error) throw error;

      if (activeProfile?.id === id) {
        setActiveProfile(null);
        localStorage.removeItem('activeProfileId');
      }

      await loadProfiles();
      toast.success('Perfil removido');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao remover perfil';
      toast.error(msg);
      throw error;
    }
  };

  const switchProfile = (profile: UserProfile) => {
    // Instant switch - data is already cached
    setActiveProfile(profile);
    localStorage.setItem('activeProfileId', profile.id);
    localStorage.setItem('cachedActiveProfile', JSON.stringify(profile));
    toast.success(`Perfil: ${profile.name}`, { duration: 1000 });

    // Notify components about profile switch
    window.dispatchEvent(new CustomEvent('profile-switched', { detail: profile }));
  };

  return {
    profiles,
    activeProfile,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    refresh: loadProfiles
  };
}