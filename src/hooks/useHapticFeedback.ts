import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * useHapticFeedback
 *
 * Provides device haptic feedback:
 * - Native platform (iOS/Android via Capacitor): uses Haptics plugin
 * - Web/PWA fallback: uses Vibration API
 *
 * Usage:
 *   const { triggerHaptic, triggerSuccess } = useHapticFeedback();
 *   triggerHaptic("light");   // subtle tick
 *   triggerSuccess();         // success notification pulse
 */
export function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    setIsSupported(isNative || "vibrate" in navigator);
  }, [isNative]);

  const triggerHaptic = useCallback(
    async (style: HapticStyle = "medium") => {
      if (!isSupported) return;

      try {
        if (isNative) {
          const { Haptics, ImpactStyle, NotificationType } = await import(
            "@capacitor/haptics"
          );

          if (style === "success" || style === "warning" || style === "error") {
            const typeMap: Record<string, import("@capacitor/haptics").NotificationType> = {
              success: NotificationType.Success,
              warning: NotificationType.Warning,
              error: NotificationType.Error,
            };
            await Haptics.notification({ type: typeMap[style] });
          } else {
            const styleMap: Record<string, import("@capacitor/haptics").ImpactStyle> = {
              light: ImpactStyle.Light,
              medium: ImpactStyle.Medium,
              heavy: ImpactStyle.Heavy,
            };
            await Haptics.impact({ style: styleMap[style] ?? ImpactStyle.Medium });
          }
        } else if (typeof navigator !== "undefined" && navigator.vibrate) {
          const patterns: Record<HapticStyle, number | number[]> = {
            light: 10,
            medium: 20,
            heavy: 30,
            success: [10, 50, 10],
            warning: [15, 100, 15],
            error: [30, 100, 30, 100, 30],
          };
          navigator.vibrate(patterns[style]);
        }
      } catch {
        // Haptics are enhancement-only — never block main flow
      }
    },
    [isSupported, isNative]
  );

  return {
    isSupported,
    triggerHaptic,
    triggerSuccess: () => triggerHaptic("success"),
    triggerWarning: () => triggerHaptic("warning"),
    triggerError: () => triggerHaptic("error"),
    triggerLight: () => triggerHaptic("light"),
    triggerMedium: () => triggerHaptic("medium"),
    triggerHeavy: () => triggerHaptic("heavy"),
  };
}
