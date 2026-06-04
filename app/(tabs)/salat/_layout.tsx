import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function SalatLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.gold,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '🕌 Salat Tracker' }} />
      <Stack.Screen name="tracker" options={{ title: 'Daily Log' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="qaza" options={{ title: 'Qaza Planner' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
