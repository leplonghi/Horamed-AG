export interface AndroidPermissionsPlugin {
    /**
     * Check if the app has SCHEDULE_EXACT_ALARM permission (Android 12+)
     */
    checkExactAlarmPermission(): Promise<{ granted: boolean }>;

    /**
     * Request SCHEDULE_EXACT_ALARM permission by opening system settings
     * Note: This permission cannot be requested via dialog, user must enable manually
     */
    requestExactAlarmPermission(): Promise<void>;

    /**
     * Check if the app is exempt from battery optimization
     */
    checkBatteryOptimization(): Promise<{ optimized: boolean }>;

    /**
     * Request to ignore battery optimization by opening system settings
     */
    requestIgnoreBatteryOptimization(): Promise<void>;

    /**
     * Get device information (manufacturer, model, Android version)
     */
    getDeviceInfo(): Promise<{
        manufacturer: string;
        model: string;
        androidVersion: number;
        sdkInt: number;
    }>;

    /**
     * Check if device is in Doze mode
     */
    isDeviceIdleMode(): Promise<{ idle: boolean }>;

    /**
     * Open app-specific settings page
     */
    openAppSettings(): Promise<void>;
}
