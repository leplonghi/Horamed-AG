import { useState, useCallback } from "react";
import { httpsCallable, functions } from "@/integrations/firebase";

export interface MedicationInfo {
  indication: string;
  therapeuticClass: string;
  activeIngredient: string;
  howToUse?: string;
  contraindications?: string;
  sideEffects?: string;
  warnings: string;
  interactions?: string;
  description?: string;
}

interface UseMedicationInfoResult {
  info: MedicationInfo | null;
  isLoading: boolean;
  error: string | null;
  fetchInfo: (medicationName: string) => Promise<void>;
  clearInfo: () => void;
}

// Cache for medication info to avoid repeated API calls
const medicationInfoCache = new Map<string, MedicationInfo>();

export function useMedicationInfo(): UseMedicationInfoResult {
  const [info, setInfo] = useState<MedicationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async (medicationName: string) => {
    const normalizedName = medicationName.toLowerCase().trim();

    // Check cache first
    if (medicationInfoCache.has(normalizedName)) {
      setInfo(medicationInfoCache.get(normalizedName)!);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const getMedicationInfo = httpsCallable<
        { medicationName: string },
        { success: boolean, data: MedicationInfo, error?: string }
      >(functions, "medicationInfo");

      const { data } = await getMedicationInfo({ medicationName });

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.data) {
        const medicationInfo = data.data;
        medicationInfoCache.set(normalizedName, medicationInfo);
        setInfo(medicationInfo);
      } else {
        throw new Error("Informações não disponíveis");
      }
    } catch (err) {
      console.error("Error fetching medication info:", err);
      setError(err instanceof Error ? err.message : "Erro ao buscar informações");
      setInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearInfo = useCallback(() => {
    setInfo(null);
    setError(null);
  }, []);

  return {
    info,
    isLoading,
    error,
    fetchInfo,
    clearInfo,
  };
}

// Utility to prefetch medication info
export function prefetchMedicationInfo(medicationName: string): void {
  const normalizedName = medicationName.toLowerCase().trim();

  if (medicationInfoCache.has(normalizedName)) {
    return; // Already cached
  }

  // Prefetch in background
  const getMedicationInfo = httpsCallable<
    { medicationName: string },
    { success: boolean, data: MedicationInfo }
  >(functions, "medicationInfo");

  getMedicationInfo({ medicationName }).then(({ data }) => {
    if (data?.success && data?.data) {
      medicationInfoCache.set(normalizedName, data.data);
    }
  }).catch(() => {
    // Silently fail for prefetch
  });
}