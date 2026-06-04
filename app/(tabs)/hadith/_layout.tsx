import { Stack } from 'expo-router';
import { COLORS } from '../../../src/constants/theme';

export default function HadithLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.gold,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: '📚 Hadith' }} />
      <Stack.Screen name="collection/[name]" options={{ title: 'Collection' }} />
    </Stack>
  );
}
