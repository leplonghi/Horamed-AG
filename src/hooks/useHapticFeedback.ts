import { useEffect, useState } from "react";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if vibration API is supported
    setIsSupported("vibrate" in navigator);
  }, []);

  const triggerHaptic = (style: HapticStyle = "medium") => {
    if (!isSupported) return;

    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [15, 100, 15],
      error: [30, 100, 30, 100, 30],
    };

    const pattern = patterns[style];
    
    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern);
    } else {
      navigator.vibrate(pattern);
    }
  };

  const triggerSuccess = () => triggerHaptic("success");
  const triggerWarning = () => triggerHaptic("warning");
  const triggerError = () => triggerHaptic("error");
  const triggerLight = () => triggerHaptic("light");
  const triggerMedium = () => triggerHaptic("medium");
  const triggerHeavy = () => triggerHaptic("heavy");

  return {
    isSupported,
    triggerHaptic,
    triggerSuccess,
    triggerWarning,
    triggerError,
    triggerLight,
    triggerMedium,
    triggerHeavy,
  };
}
