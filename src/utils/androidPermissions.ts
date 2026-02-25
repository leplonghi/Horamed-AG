/**
 * Android Permissions Utility
 * 
 * Handles Android-specific permissions for notifications with app closed:
 * 1. SCHEDULE_EXACT_ALARM (Android 12+)
 * 2. Battery Optimization exemption
 * 3. Doze Mode detection
 * 
 * Now using native plugin for real permission checks!
 */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { AndroidPermissions } from "../../plugins/android-permissions/src";

export interface AndroidPermissionStatus {
    hasExactAlarmPermission: boolean;
    isBatteryOptimized: boolean;
    canScheduleExactAlarms: boolean;
    deviceInfo: {
        manufacturer: string;
        model: string;
        androidVersion: number;
    };
}

/**
 * Check if device is running Android 12+ (API 31+)
 */
export async function isAndroid12Plus(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
        return false;
    }

    try {
        const info = await AndroidPermissions.getDeviceInfo();
        return info.sdkInt >= 31;
    } catch {
        return false;
    }
}

/**
 * Request SCHEDULE_EXACT_ALARM permission (Android 12+)
 * Opens system settings for user to manually enable
 */
export async function requestExactAlarmPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
        return false;
    }

    try {
        const hasPermission = await checkExactAlarmPermission();

        if (hasPermission) {
            return true;
        }

        // Open settings for user to grant permission manually
        await AndroidPermissions.requestExactAlarmPermission();
        console.log("[Android] Opened exact alarm settings");

        return false; // User needs to manually enable
    } catch (error) {
        console.error("[Android] Error requesting exact alarm permission:", error);
        return false;
    }
}

/**
 * Check if app has SCHEDULE_EXACT_ALARM permission
 */
export async function checkExactAlarmPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
        return true; // Not Android, no need for this permission
    }

    try {
        const result = await AndroidPermissions.checkExactAlarmPermission();
        return result.granted;
    } catch (error) {
        console.error("[Android] Error checking exact alarm permission:", error);
        // Fallback
        try {
            const perms = await LocalNotifications.checkPermissions();
            return perms.display === "granted";
        } catch {
            return false;
        }
    }
}

/**
 * Check if app is battery optimized
 */
export async function checkBatteryOptimization(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
        return false; // Not Android, no battery optimization
    }

    try {
        const result = await AndroidPermissions.checkBatteryOptimization();
        return result.optimized;
    } catch (error) {
        console.error("[Android] Error checking battery optimization:", error);
        return true; // Assume worst case
    }
}

/**
 * Request to ignore battery optimization
 * Opens system settings for user to manually disable
 */
export async function requestIgnoreBatteryOptimization(): Promise<void> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
        return;
    }

    try {
        await AndroidPermissions.requestIgnoreBatteryOptimization();
        console.log("[Android] Opened battery optimization settings");
    } catch (error) {
        console.error("[Android] Error opening battery settings:", error);
    }
}

/**
 * Get device manufacturer for specific instructions
 */
export async function getDeviceManufacturer(): Promise<string> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
        return "Unknown";
    }

    try {
        const info = await AndroidPermissions.getDeviceInfo();
        return info.manufacturer;
    } catch {
        return "Unknown";
    }
}

/**
 * Get manufacturer-specific battery optimization instructions
 */
export function getManufacturerInstructions(manufacturer: string): {
    title: string;
    steps: string[];
} {
    const instructions: Record<string, { title: string; steps: string[] }> = {
        Xiaomi: {
            title: "Xiaomi / MIUI",
            steps: [
                "Abra Configurações > Apps > Gerenciar apps",
                "Encontre 'HoraMed' na lista",
                "Toque em 'Economia de bateria'",
                "Selecione 'Sem restrições'",
                "Ative 'Inicialização automática'",
                "Volte e toque em 'Outras permissões'",
                "Ative 'Exibir janelas pop-up'",
            ],
        },
        Huawei: {
            title: "Huawei / EMUI",
            steps: [
                "Abra Configurações > Bateria",
                "Toque em 'Inicialização de apps'",
                "Encontre 'HoraMed' e ative",
                "Volte e abra 'Apps'",
                "Toque em 'HoraMed'",
                "Selecione 'Bateria'",
                "Escolha 'Gerenciar manualmente'",
                "Ative todas as opções",
            ],
        },
        Samsung: {
            title: "Samsung / One UI",
            steps: [
                "Abra Configurações > Apps",
                "Toque em 'HoraMed'",
                "Selecione 'Bateria'",
                "Escolha 'Sem restrições'",
                "Volte e toque em 'Uso de dados móveis'",
                "Ative 'Permitir uso em segundo plano'",
            ],
        },
        OnePlus: {
            title: "OnePlus / OxygenOS",
            steps: [
                "Abra Configurações > Bateria",
                "Toque em 'Otimização de bateria'",
                "Encontre 'HoraMed'",
                "Selecione 'Não otimizar'",
                "Volte para Configurações > Apps",
                "Toque em 'HoraMed'",
                "Ative 'Inicialização automática'",
            ],
        },
        Oppo: {
            title: "Oppo / ColorOS",
            steps: [
                "Abra Configurações > Bateria",
                "Toque em 'Economia de energia'",
                "Encontre 'HoraMed'",
                "Desative otimização",
                "Volte para Configurações",
                "Abra 'Gerenciamento de apps'",
                "Toque em 'HoraMed'",
                "Ative 'Permitir em segundo plano'",
            ],
        },
        Vivo: {
            title: "Vivo / Funtouch OS",
            steps: [
                "Abra Configurações > Bateria",
                "Toque em 'Consumo de bateria em segundo plano'",
                "Encontre 'HoraMed'",
                "Selecione 'Permitir'",
                "Volte para Configurações > Apps",
                "Toque em 'HoraMed'",
                "Ative 'Inicialização automática'",
            ],
        },
    };

    return (
        instructions[manufacturer] || {
            title: "Configuração Geral",
            steps: [
                "Abra Configurações do Android",
                "Vá em Apps ou Aplicativos",
                "Encontre 'HoraMed'",
                "Toque em 'Bateria'",
                "Selecione 'Sem restrições' ou 'Não otimizar'",
                "Ative permissões de segundo plano se disponível",
            ],
        }
    );
}

/**
 * Get complete Android permission status
 */
export async function getAndroidPermissionStatus(): Promise<AndroidPermissionStatus> {
    const hasExactAlarm = await checkExactAlarmPermission();
    const isBatteryOptimized = await checkBatteryOptimization();
    const manufacturer = await getDeviceManufacturer();

    let androidVersion = 0;
    try {
        const info = await AndroidPermissions.getDeviceInfo();
        androidVersion = info.sdkInt;
    } catch {
        androidVersion = 0;
    }

    return {
        hasExactAlarmPermission: hasExactAlarm,
        isBatteryOptimized,
        canScheduleExactAlarms: hasExactAlarm && !isBatteryOptimized,
        deviceInfo: {
            manufacturer,
            model: "Unknown",
            androidVersion,
        },
    };
}
