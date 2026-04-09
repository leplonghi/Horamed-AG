import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  type BannerAdOptions,
  type RewardAdOptions,
} from "@capacitor-community/admob";
import { isUsingTestAdUnit } from "@/lib/adsConfig";

const BANNER_MARGIN = 88;

let initializePromise: Promise<void> | null = null;

function canUseNativeAdMob() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function initializeNativeAdMob() {
  if (!canUseNativeAdMob()) return;

  if (!initializePromise) {
    initializePromise = AdMob.initialize({
      initializeForTesting: false,
      testingDevices: [],
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    }).catch((error) => {
      initializePromise = null;
      throw error;
    });
  }

  await initializePromise;
}

export async function showNativeBanner(adId: string) {
  if (!canUseNativeAdMob() || !adId) return;

  await initializeNativeAdMob();

  const options: BannerAdOptions = {
    adId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: BANNER_MARGIN,
    isTesting: isUsingTestAdUnit(adId),
    npa: true,
  };

  await AdMob.showBanner(options);
}

export async function removeNativeBanner() {
  if (!canUseNativeAdMob()) return;

  await AdMob.removeBanner();
}

export async function showRewardedAd(adId: string) {
  if (!canUseNativeAdMob() || !adId) return null;

  await initializeNativeAdMob();

  const options: RewardAdOptions = {
    adId,
    isTesting: isUsingTestAdUnit(adId),
    immersiveMode: true,
    npa: true,
  };

  await AdMob.prepareRewardVideoAd(options);
  return AdMob.showRewardVideoAd();
}
