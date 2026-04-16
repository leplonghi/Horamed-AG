import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

type NativePlatform = "android" | "ios";

interface PlatformVersionConfig {
  latestVersion?: string;
  message?: string;
  minimumVersion?: string;
  storeUrl?: string;
}

interface VersionControlDocument {
  android?: PlatformVersionConfig;
  ios?: PlatformVersionConfig;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion?: string;
  message?: string;
  minimumVersion: string;
  required: boolean;
  storeUrl?: string;
}

interface ForceUpdateState {
  checking: boolean;
  updateInfo: UpdateInfo | null;
}

const isNativePlatform = Capacitor.isNativePlatform();
const resolvedPlatform = Capacitor.getPlatform();
const nativePlatform: NativePlatform | null =
  isNativePlatform && (resolvedPlatform === "android" || resolvedPlatform === "ios")
    ? resolvedPlatform
    : null;

function parseVersionPart(part: string) {
  const normalized = part.trim();
  if (!normalized) {
    return 0;
  }

  const numeric = Number.parseInt(normalized, 10);
  return Number.isFinite(numeric) ? numeric : 0;
}

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map(parseVersionPart);
  const rightParts = right.split(".").map(parseVersionPart);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;

    if (leftValue < rightValue) {
      return -1;
    }

    if (leftValue > rightValue) {
      return 1;
    }
  }

  return 0;
}

function normalizeVersion(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sameUpdateInfo(left: UpdateInfo | null, right: UpdateInfo | null) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.required === right.required &&
    left.currentVersion === right.currentVersion &&
    left.minimumVersion === right.minimumVersion &&
    left.latestVersion === right.latestVersion &&
    left.storeUrl === right.storeUrl &&
    left.message === right.message
  );
}

function buildPermissiveState(): ForceUpdateState {
  return {
    checking: false,
    updateInfo: null,
  };
}

export function useForceUpdate() {
  const [state, setState] = useState<ForceUpdateState>({
    checking: isNativePlatform,
    updateInfo: null,
  });
  const appVersionRef = useRef<string>("");
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const updateInfoRef = useRef<UpdateInfo | null>(null);

  const updateState = useCallback((nextState: ForceUpdateState) => {
    if (!mountedRef.current) {
      return;
    }

    setState((currentState) => {
      if (
        currentState.checking === nextState.checking &&
        sameUpdateInfo(currentState.updateInfo, nextState.updateInfo)
      ) {
        return currentState;
      }

      return nextState;
    });
  }, []);

  useEffect(() => {
    updateInfoRef.current = state.updateInfo;
  }, [state.updateInfo]);

  const checkForUpdate = useCallback(async () => {
    if (!nativePlatform || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    updateState({
      checking: true,
      updateInfo: updateInfoRef.current,
    });

    try {
      if (!appVersionRef.current) {
        const appInfo = await App.getInfo();
        appVersionRef.current = normalizeVersion(appInfo.version);
      }

      const currentVersion = appVersionRef.current;
      const snapshot = await getDoc(doc(db, "appConfig", "versionControl"));

      if (!snapshot.exists()) {
        updateState(buildPermissiveState());
        return;
      }

      const data = snapshot.data() as VersionControlDocument;
      const platformConfig = data?.[nativePlatform];
      const minimumVersion = normalizeVersion(platformConfig?.minimumVersion);

      if (!platformConfig || !minimumVersion) {
        updateState(buildPermissiveState());
        return;
      }

      const nextInfo: UpdateInfo = {
        currentVersion,
        latestVersion: normalizeVersion(platformConfig.latestVersion) || undefined,
        message: normalizeVersion(platformConfig.message) || undefined,
        minimumVersion,
        required: compareVersions(currentVersion, minimumVersion) < 0,
        storeUrl: normalizeVersion(platformConfig.storeUrl) || undefined,
      };

      updateState({
        checking: false,
        updateInfo: nextInfo.required ? nextInfo : null,
      });
    } catch (error) {
      console.warn("[ForceUpdate] Failed to verify version control:", error);
      updateState(buildPermissiveState());
    } finally {
      inFlightRef.current = false;
    }
  }, [updateState]);

  useEffect(() => {
    mountedRef.current = true;

    if (!nativePlatform) {
      updateState({
        checking: false,
        updateInfo: null,
      });

      return () => {
        mountedRef.current = false;
      };
    }

    void checkForUpdate();

    let appStateHandle: { remove: () => Promise<void> } | null = null;

    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        void checkForUpdate();
      }
    }).then((handle) => {
      appStateHandle = handle;
    });

    return () => {
      mountedRef.current = false;

      if (appStateHandle) {
        void appStateHandle.remove();
      }
    };
  }, [checkForUpdate, updateState]);

  return {
    checking: state.checking,
    isNativeApp: Boolean(nativePlatform),
    platform: nativePlatform,
    recheck: checkForUpdate,
    updateInfo: state.updateInfo,
  };
}
