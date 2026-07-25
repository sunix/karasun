import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  useEffect(() => {
    useAuthStore.getState().hydrate();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="player" options={{ headerShown: true, title: 'Karaoké' }} />
        <Stack.Screen name="devices" options={{ presentation: 'modal', headerShown: true, title: 'Choisir un appareil' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
