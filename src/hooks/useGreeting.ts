import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseGreetingOptions {
  profileName?: string;
  isSelf?: boolean;
  /** 0-1 adherence rate for today so far — drives motivational tone */
  adherenceRate?: number;
  /** Total medications for today — personalises empty-state message */
  todayTotal?: number;
}

type GreetingTone = "motivating" | "celebrating" | "encouraging" | "neutral";

/**
 * useGreeting
 *
 * Returns a time-aware greeting + a motivational quote/subtitle.
 * The tone adapts based on today's adherence rate:
 *  - No meds yet   → neutral welcome
 *  - Low adherence → motivating
 *  - Mid adherence → encouraging
 *  - High adherence → celebrating
 *
 * Pure computation: no side-effects, no async — safe on every render.
 */
export function useGreeting({
  profileName,
  isSelf = true,
  adherenceRate,
  todayTotal = 0,
}: UseGreetingOptions = {}) {
  const { t, language } = useLanguage();

  const hour = new Date().getHours();

  return useMemo(() => {
    // ── Greeting phrase ────────────────────────────────────────────────────
    let greeting: string;
    if (hour < 12) greeting = t("today.goodMorning");
    else if (hour < 18) greeting = t("today.goodAfternoon");
    else greeting = t("today.goodEvening");

    // Name suffix: "Bom dia, João" vs just "Bom dia"
    const greetingWithName = profileName
      ? `${greeting}, ${profileName.split(" ")[0]}`
      : greeting;

    // ── Motivational tone logic ────────────────────────────────────────────
    let tone: GreetingTone = "neutral";
    if (todayTotal > 0 && adherenceRate !== undefined) {
      if (adherenceRate >= 0.9) tone = "celebrating";
      else if (adherenceRate >= 0.5) tone = "encouraging";
      else tone = "motivating";
    }

    // ── Quote pool mapped to period + tone ────────────────────────────────
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "night";

    let quotes: string[];

    if (!isSelf && profileName) {
      // Caregiver view — personalised with profile name
      quotes = [
        t(`today.quote.other.${period}1`, { profileName }),
        t(`today.quote.other.${period}2`, { profileName }),
      ];
    } else {
      // Self view — tone-driven selection
      const toneQuotes: Record<GreetingTone, string[]> = {
        celebrating: [
          t("today.quote.celebrating1"),
          t("today.quote.celebrating2"),
          t(`today.quote.${period}1`),
        ],
        encouraging: [
          t("today.quote.encouraging1"),
          t(`today.quote.${period}2`),
        ],
        motivating: [
          t("today.quote.motivating1"),
          t(`today.quote.${period}3`),
        ],
        neutral: [
          t(`today.quote.${period}1`),
          t(`today.quote.${period}2`),
          t(`today.quote.${period}3`),
        ],
      };
      quotes = toneQuotes[tone].filter(Boolean);
    }

    // Pick a deterministic random quote (stable per day, not per render)
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const subtitle = quotes[dayOfYear % quotes.length] ?? "";

    return {
      greeting,
      greetingWithName,
      subtitle,
      tone,
      period,
      /** Legacy compat — array of available quotes */
      quotes,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, isSelf, profileName, adherenceRate, todayTotal, language, t]);
}
