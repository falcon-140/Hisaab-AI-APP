import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HisaabProvider } from '../context/HisaabContext';

export default function RootLayout() {
  return (
    <HisaabProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </HisaabProvider>
  );
}
