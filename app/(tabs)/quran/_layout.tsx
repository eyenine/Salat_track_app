import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function QuranLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.gold,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '📖 Al-Quran' }} />
      <Stack.Screen name="surah/[id]" options={{ title: 'Surah' }} />
      <Stack.Screen name="search" options={{ title: 'Search Quran' }} />
      <Stack.Screen name="bookmarks" options={{ title: 'Bookmarks' }} />
    </Stack>
  );
}
