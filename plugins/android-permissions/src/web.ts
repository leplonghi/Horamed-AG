import { WebPlugin } from '@capacitor/core';

import type { AndroidPermissionsPlugin } from './definitions';

export class AndroidPermissionsWeb extends WebPlugin implements AndroidPermissionsPlugin {
    async checkExactAlarmPermission(): Promise<{ granted: boolean }> {
        // Web doesn't need this permission
        return { granted: true };
    }

    async requestExactAlarmPermission(): Promise<void> {
        console.log('requestExactAlarmPermission not available on web');
    }

    async checkBatteryOptimization(): Promise<{ optimized: boolean }> {
        // Web doesn't have battery optimization
        return { optimized: false };
    }

    async requestIgnoreBatteryOptimization(): Promise<void> {
        console.log('requestIgnoreBatteryOptimization not available on web');
    }

    async getDeviceInfo(): Promise<{
        manufacturer: string;
        model: string;
        androidVersion: number;
        sdkInt: number;
    }> {
        return {
            manufacturer: 'Web',
            model: navigator.userAgent,
            androidVersion: 0,
            sdkInt: 0,
        };
    }

    async isDeviceIdleMode(): Promise<{ idle: boolean }> {
        return { idle: false };
    }

    async openAppSettings(): Promise<void> {
        console.log('openAppSettings not available on web');
    }
}
