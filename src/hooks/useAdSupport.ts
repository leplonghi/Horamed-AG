import { useEffect, useMemo, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";

const STORAGE_KEY = "horamed_ad_support_state";
const AD_FREE_HOURS = 6;
const CLAIM_COOLDOWN_HOURS = 24;

interface AdSupportState {
  adFreeUntil: number | null;
  nextClaimAt: number | null;
}

function readState(): AdSupportState {
  if (typeof window === "undefined") {
    return { adFreeUntil: null, nextClaimAt: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { adFreeUntil: null, nextClaimAt: null };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdSupportState>;
    return {
      adFreeUntil: typeof parsed.adFreeUntil === "number" ? parsed.adFreeUntil : null,
      nextClaimAt: typeof parsed.nextClaimAt === "number" ? parsed.nextClaimAt : null,
    };
  } catch {
    return { adFreeUntil: null, nextClaimAt: null };
  }
}

function persistState(state: AdSupportState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAdSupport() {
  const { hasFeature } = useSubscription();
  const [state, setState] = useState<AdSupportState>(() => readState());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const isTemporarilyAdFree = Boolean(state.adFreeUntil && state.adFreeUntil > now);
  const hasAdFreeAccess = hasFeature("no_ads") || isTemporarilyAdFree;
  const canClaimDailyPause = !hasFeature("no_ads") && (!state.nextClaimAt || state.nextClaimAt <= now);

  const adFreeUntilDate = useMemo(
    () => (state.adFreeUntil ? new Date(state.adFreeUntil) : null),
    [state.adFreeUntil]
  );

  const nextClaimDate = useMemo(
    () => (state.nextClaimAt ? new Date(state.nextClaimAt) : null),
    [state.nextClaimAt]
  );

  const activateDailyPause = () => {
    const nextState = {
      adFreeUntil: Date.now() + AD_FREE_HOURS * 60 * 60 * 1000,
      nextClaimAt: Date.now() + CLAIM_COOLDOWN_HOURS * 60 * 60 * 1000,
    };

    setState(nextState);
    setNow(Date.now());
    persistState(nextState);

    return nextState;
  };

  return {
    adFreeHours: AD_FREE_HOURS,
    canClaimDailyPause,
    hasAdFreeAccess,
    isTemporarilyAdFree,
    adFreeUntilDate,
    nextClaimDate,
    activateDailyPause,
  };
}
