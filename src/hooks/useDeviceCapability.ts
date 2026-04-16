import { useMemo, useState, useEffect } from "react";

interface DeviceCapability {
  isLowPerformance: boolean;
  prefersReducedMotion: boolean;
  userPrefersReducedMotion: boolean;
  shouldReduceEffects: boolean;
}

/**
 * Detecta a capacidade do dispositivo para adaptar efeitos visuais.
 * - isLowPerformance: menos de 4 cores ou menos de 4GB de RAM
 * - prefersReducedMotion: preferência do SO por menos animação
 * - userPrefersReducedMotion: preferência do usuário salva no app
 * - shouldReduceEffects: true se qualquer condição de redução estiver ativa
 */
export function useDeviceCapability(): DeviceCapability {
  const [userPref, setUserPref] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("performance_mode");
    if (saved !== null) {
      setUserPref(saved === "low");
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "performance_mode") {
        setUserPref(e.newValue === "low");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return useMemo(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cores = navigator.hardwareConcurrency ?? 8;
    // deviceMemory é experimental mas bem suportado no Android
    const memory = (navigator as any).deviceMemory ?? 8;

    const isLowPerformance = cores < 4 || memory < 4;
    const userPrefersReducedMotion = userPref === true;

    const shouldReduceEffects =
      isLowPerformance || prefersReducedMotion || userPrefersReducedMotion;

    return {
      isLowPerformance,
      prefersReducedMotion,
      userPrefersReducedMotion,
      shouldReduceEffects,
    };
  }, [userPref]);
}
