import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { fetchCollection, fetchDocument, updateDocument, setDocument } from "@/integrations/firebase";
import { auth } from "@/integrations/firebase/client";

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
    const resolvedUser = user || auth.currentUser;
    if (!resolvedUser) {
      setIsCompleted(null);
      setLoading(false);
      return;
    }

    // LocalStorage fast path — avoids Firestore round-trip for returning users
    const lsKey = `horamed_onboarding_${resolvedUser.uid}`;
    try {
      const lsCached = localStorage.getItem(lsKey);
      if (lsCached === 'true') {
        setIsCompleted(true);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("LocalStorage access denied in OnboardingContext", e);
    }

    // Timeout safety — don't block the app forever if Firestore is slow
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Onboarding check timeout")), 6000)
    );

    const statusPromise = (async () => {
      try {
        // 1. Check root document first (Legacy/Main way seen in DB)
        const { data: userData, error: uError } = await fetchDocument<any>("users", resolvedUser.uid);
        
        if (uError) {
          console.warn("Firestore error checking root user, allowing pass-through:", uError);
          return true; 
        }

        if (userData && userData.onboardingCompleted === true) {
          return true;
        }

        // 2. Check if we have a primary profile completed (Modern multi-profile way)
        const { data: profiles, error: pError } = await fetchCollection<any>(`users/${resolvedUser.uid}/profiles`);
        
        if (pError) {
          console.warn("Firestore error checking profiles:", pError);
          // If we can't check profiles but root was false, we keep checking
        } else {
          const primaryProfile = profiles?.find((p: any) => p.isPrimary) || (profiles && profiles.length > 0 ? profiles[0] : null);
          if (primaryProfile && primaryProfile.onboardingCompleted) {
            return true;
          }
        }

        // 3. Check settings collection (Alternative fallback)
        const { data: onboardingSettings, error: sError } = await fetchDocument<any>(`users/${resolvedUser.uid}/settings`, 'onboarding');
        
        if (sError) {
          console.warn("Firestore error checking settings:", sError);
        } else if (onboardingSettings?.isCompleted) {
          return true;
        }

        return false;
      } catch (e) {
        console.error("Internal check error:", e);
        return true; // Safe fallback
      }
    })();

    setLoading(true);
    try {
      const result = await Promise.race([statusPromise, timeoutPromise]) as boolean;
      if (result) {
        try {
          localStorage.setItem(lsKey, 'true');
        } catch (e) {
          // Silently fail if localStorage is blocked (e.g. private mode)
        }
      }
      setIsCompleted(result);
    } catch (error) {
      console.warn("Onboarding status check failed or timed out:", error);
      // Fail-safe: assume completed to avoid "eternal loading" or "onboarding trap"
      setIsCompleted(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const completeOnboarding = async () => {
    const resolvedUser = user || auth.currentUser;
    if (!resolvedUser) return;
    
    try {
      const { data: profiles } = await fetchCollection<any>(`users/${resolvedUser.uid}/profiles`);
      const primaryProfile = profiles?.find((p: any) => p.isPrimary) || (profiles && profiles.length > 0 ? profiles[0] : null);

      if (primaryProfile) {
        await updateDocument(`users/${resolvedUser.uid}/profiles`, primaryProfile.id, {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString()
        });
      }

      // Sync to root document too for consistency
      await updateDocument("users", resolvedUser.uid, {
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      });

      // Always update settings as generic fallback
      await setDocument(`users/${resolvedUser.uid}/settings`, 'onboarding', {
        isCompleted: true,
        completedAt: new Date().toISOString(),
        flowVersion: 'v2'
      });

      try {
        localStorage.setItem(`horamed_onboarding_${resolvedUser.uid}`, 'true');
      } catch (e) {
        // Silently fail if localStorage is blocked
      }
      
      setIsCompleted(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Final fallback to avoid trap even if DB write fails
      setIsCompleted(true);
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
