import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchCollection, updateDocument, setDocument } from "@/integrations/firebase";

interface OnboardingContextType {
  isCompleted: boolean | null;
  loading: boolean;
  completeOnboarding: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setIsCompleted(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Check for primary profile onboarding status
      const { data: profiles } = await fetchCollection<any>(`users/${user.uid}/profiles`);
      const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

      if (primaryProfile && primaryProfile.onboardingCompleted) {
        setIsCompleted(true);
      } else {
        // Fallback to settings
        const { data: settings } = await fetchCollection<any>(`users/${user.uid}/settings`);
        const onboardingSettings = settings?.find(s => s.id === 'onboarding');
        setIsCompleted(!!onboardingSettings?.isCompleted);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsCompleted(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const completeOnboarding = async () => {
    if (!user) return;
    
    try {
      const { data: profiles } = await fetchCollection<any>(`users/${user.uid}/profiles`);
      const primaryProfile = profiles?.find(p => p.isPrimary) || profiles?.[0];

      if (primaryProfile) {
        await updateDocument(`users/${user.uid}/profiles`, primaryProfile.id, {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString()
        });
      } else {
        await setDocument(`users/${user.uid}/settings`, 'onboarding', {
          isCompleted: true,
          completedAt: new Date().toISOString(),
          flowVersion: 'v2'
        });
      }
      setIsCompleted(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  return (
    <OnboardingContext.Provider value={{ 
      isCompleted, 
      loading, 
      completeOnboarding, 
      refreshOnboardingStatus: checkStatus 
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};
