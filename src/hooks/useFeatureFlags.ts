import { useCallback, useEffect, useState } from "react";
import { fetchCollection } from "@/integrations/firebase";

interface FeatureFlag {
  id: string;
  key: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
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

const FEATURE_FLAG_KEYS = new Set<keyof FeatureFlags>(
  Object.keys(DEFAULT_FLAGS) as Array<keyof FeatureFlags>,
);

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  const loadFeatureFlags = useCallback(async () => {
    try {
      const { data, error } = await fetchCollection("feature_flags");

      if (error) {
        throw error;
      }

      if (data) {
        const flagsMap = (data as FeatureFlag[]).reduce<FeatureFlags>((acc, flag) => {
          if (FEATURE_FLAG_KEYS.has(flag.key as keyof FeatureFlags)) {
            const key = flag.key as keyof FeatureFlags;
            acc[key] = Boolean(flag.enabled);
          }

          return acc;
        }, { ...DEFAULT_FLAGS });

        setFlags(flagsMap);
      }
    } catch (error) {
      console.error("Error loading feature flags:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeatureFlags();
  }, [loadFeatureFlags]);

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
