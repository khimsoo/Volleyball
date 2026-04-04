import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'VolleyTrainer',
  slug: 'volley-trainer',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'volley-trainer',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0A0E1A',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.volleytrainer.app',
    infoPlist: {
      NSHealthShareUsageDescription: 'VolleyTrainer uses HealthKit to read your HRV and sleep data for readiness tracking.',
      NSHealthUpdateUsageDescription: 'VolleyTrainer writes workout sessions to HealthKit.',
      NSBluetoothAlwaysUsageDescription: 'VolleyTrainer uses Bluetooth to connect to heart rate monitors and wearable devices.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0A0E1A',
    },
    package: 'com.volleytrainer.app',
    permissions: [
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BODY_SENSORS',
    ],
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0A0E1A',
        image: './assets/images/splash.png',
        resizeMode: 'contain',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default config;
