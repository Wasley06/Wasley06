import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fabegon.erp',
  appName: 'Fabegon ERP',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'tzvlavmaaummnufibgkt.supabase.co',
      '*.supabase.co',
      'wa.me',
    ],
  },
  android: {
    buildOptions: {
      keystorePath: process.env.KEYSTORE_PATH,
      keystoreAlias: process.env.KEYSTORE_ALIAS,
      keystorePassword: process.env.KEYSTORE_PASSWORD,
      keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD,
    },
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3D7FFF',
    },
  },
}

export default config
