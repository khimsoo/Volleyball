import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '../services/api.js';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0A0E1A' },
            headerTintColor: '#FFFFFF',
            contentStyle: { backgroundColor: '#0A0E1A' },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(modals)/session-start"
            options={{ presentation: 'modal', title: 'Start Session' }}
          />
          <Stack.Screen
            name="(modals)/session-active"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="(modals)/test-entry"
            options={{ presentation: 'modal', title: 'Log Performance Test' }}
          />
          <Stack.Screen
            name="(modals)/drill-detail"
            options={{ presentation: 'modal', title: 'Drill Detail' }}
          />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
