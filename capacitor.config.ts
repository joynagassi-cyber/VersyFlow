import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.versyflow.app',
  appName: 'VersyFlow',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      // Native-context hex values (documented exception to the design-token
      // rule): the splash/status bar colors are baked into native resources
      // at build time, so CSS vars / Tailwind tokens are not available here.
      // #FFF0F6 = surface-tint light; #E91E8C = primary-dark.
      backgroundColor: '#FFF0F6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#E91E8C',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#FFF0F6',
      overlaysWebView: false,
    },
  },
};

export default config;
