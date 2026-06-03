import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { initDB } from '../src/db/database';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { requestNotificationPermissions, schedulePrayerNotifications } from '../src/services/notificationService';
import { COLORS } from '../src/constants/theme';

export default function Layout() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDB();
        setDbReady(true);
        // Request permission and schedule local notifications for prayer times
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await schedulePrayerNotifications();
        }
      } catch (e: any) {
        setError(e.message);
      }
    }
    setup();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.bg }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>DB Error: {error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={{ marginTop: 16, color: COLORS.textSoft, fontSize: 16, fontWeight: '600' }}>
          Loading Salat Tracker...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
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
    </>
  );
}
