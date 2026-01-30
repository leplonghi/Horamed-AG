import { useState, useEffect } from "react";
import { fetchCollection } from "@/integrations/firebase";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface FeatureFlags {
  badges: boolean;
  emergency: boolean;
  prices: boolean;
  advancedDash: boolean;
  interactions: boolean;
  aiStreaming: boolean;
  caregiverHandshake: boolean;
  consultationQR: boolean;
  affiliate: boolean;
  interactionsLite: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  badges: false,
  emergency: false,
  prices: false,
  advancedDash: false,
  interactions: false,
  aiStreaming: false,
  caregiverHandshake: false,
  consultationQR: false,
  affiliate: false,
  interactionsLite: false,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      // Trying to fetch from Firestore 'featureFlags' collection
      // Ensure this collection exists and is readable in Firestore Security Rules
      // If collection doesn't exist, it will return empty array
      const { data } = await fetchCollection<any>("featureFlags");

      if (data && data.length > 0) {
        // Flatten array to object
        const flagsMap = data.reduce((acc, flag: any) => {
          // Assume document has 'key' and 'enabled' fields
          // Or document ID is the key? 
          // Supabase version had 'key' column. Let's assume documents have 'key' field or use doc ID as key.
          const flagKey = flag.key || flag.id;
          if (flagKey) {
            acc[flagKey as keyof FeatureFlags] = flag.enabled;
          }
          return acc;
        }, { ...DEFAULT_FLAGS });

        setFlags(flagsMap);
      } else {
        // Fallback or use defaults if no data found (e.g. migration not run yet)
        console.warn("No feature flags found in Firestore. Using defaults.");
        setFlags(DEFAULT_FLAGS);
      }
    } catch (error) {
      console.error("Error loading feature flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (feature: keyof FeatureFlags): boolean => {
    return flags[feature] || false;
  };

  return {
    flags,
    loading,
    isEnabled,
    refresh: loadFeatureFlags,
  };
}
