import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetworkMonitoring, useNotifications } from '@/src/hooks/useNetwork';
import { useAuthStore } from '@/src/store/authStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, restoreSession } = useAuthStore();
  useNetworkMonitoring();
  useNotifications();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ animation: "none" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course-detail" options={{ headerShown: true, title: 'Course Details' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
