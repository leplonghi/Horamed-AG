import { Capacitor } from "@capacitor/core";

export type AdPlacement = "routine_feed" | "wallet_feed" | "today_secondary";

const TEST_IDS = {
  android: {
    appId: "ca-app-pub-3940256099942544~3347511713",
    banner: "ca-app-pub-3940256099942544/9214589741",
    rewarded: "ca-app-pub-3940256099942544/5224354917",
  },
  web: {
    clientId: "",
  },
} as const;

const webPlacements: Record<AdPlacement, string> = {
  routine_feed: import.meta.env.VITE_AD_SLOT_ROUTINE_FEED ?? "",
  wallet_feed: import.meta.env.VITE_AD_SLOT_WALLET_FEED ?? "",
  today_secondary: import.meta.env.VITE_AD_SLOT_TODAY_SECONDARY ?? "",
};

const nativeBannerPlacements: Record<AdPlacement, string> = {
  routine_feed: import.meta.env.VITE_ADMOB_BANNER_ROUTINE_ANDROID ?? TEST_IDS.android.banner,
  wallet_feed: import.meta.env.VITE_ADMOB_BANNER_WALLET_ANDROID ?? TEST_IDS.android.banner,
  today_secondary: import.meta.env.VITE_ADMOB_BANNER_TODAY_ANDROID ?? TEST_IDS.android.banner,
};

export const ADS_CONFIG = {
  web: {
    clientId: import.meta.env.VITE_ADSENSE_CLIENT_ID ?? TEST_IDS.web.clientId,
    placements: webPlacements,
  },
  native: {
    androidAppId: import.meta.env.VITE_ADMOB_APP_ID_ANDROID ?? TEST_IDS.android.appId,
    rewardedAdId: import.meta.env.VITE_ADMOB_REWARDED_ANDROID ?? TEST_IDS.android.rewarded,
    placements: nativeBannerPlacements,
  },
};

export function isNativeAdPlatform() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function getBannerPlacementId(placement: AdPlacement) {
  return isNativeAdPlatform()
    ? ADS_CONFIG.native.placements[placement]
    : ADS_CONFIG.web.placements[placement];
}

export function getRewardedPlacementId() {
  return ADS_CONFIG.native.rewardedAdId;
}

export function isUsingTestAdUnit(adUnitId?: string) {
  if (!adUnitId) return false;

  return (
    adUnitId === TEST_IDS.android.banner ||
    adUnitId === TEST_IDS.android.rewarded
  );
}
