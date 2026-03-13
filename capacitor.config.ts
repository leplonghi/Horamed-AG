import { CapacitorConfig } from '@capacitor/cli';

/**
 * PRODUCTION CONFIG
 * - server.url must be commented out
 * - webContentsDebuggingEnabled must be FALSE for Play Store release
 */
const config: CapacitorConfig = {
  appId: 'com.horamed.app',
  appName: 'HoraMed',
  webDir: 'dist',
  // Development server - COMMENT OUT FOR PRODUCTION BUILDS
  // server: {
  //   url: 'http://192.168.1.10:8080',
  //   cleartext: true
  // },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
  },
  android: {
    buildOptions: {
      keystorePath: '../keystore/horamed-release.keystore',
      keystoreAlias: 'horamed-key',
    }
  }
};

export default config;
