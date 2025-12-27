import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.horamed.app',
  appName: 'HoraMed',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#10B981',
      sound: 'notification.wav',
      // Android specific
      channelId: 'horamed-medicamentos',
      channelName: 'Lembretes de Medicamentos',
      channelDescription: 'Notificações para lembrar de tomar medicamentos',
      channelImportance: 5, // IMPORTANCE_HIGH - shows heads-up notification
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#10B981',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Enable background execution for alarms
    backgroundColor: '#10B981',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    // Request authorization for notifications
    limitsNavigationsToAppBoundDomains: true,
  }
};

export default config;
