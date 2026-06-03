import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface BottomNavBarProps {
  activeRoute: 'index' | 'tracker' | 'dashboard' | 'qaza' | 'settings';
}

export default function BottomNavBar({ activeRoute }: BottomNavBarProps) {
  const tabs = [
    { key: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { key: 'tracker', label: 'Log', icon: 'calendar-outline', iconActive: 'calendar' },
    { key: 'dashboard', label: 'Stats', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
    { key: 'qaza', label: 'Qaza', icon: 'sync-outline', iconActive: 'sync' },
    { key: 'settings', label: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
  ] as const;

  const handleNavigate = (key: typeof tabs[number]['key']) => {
    if (key === activeRoute) return;
    if (key === 'index') {
      router.replace('/');
    } else {
      router.replace(`/${key}`);
    }
  };

  return (
    <View style={styles.navBar}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeRoute;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => handleNavigate(tab.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? tab.iconActive : tab.icon}
              size={20}
              color={isActive ? COLORS.gold : COLORS.textMuted}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    height: 68,
    backgroundColor: 'rgba(18, 23, 30, 0.94)', // Translucent glassmorphism background
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    paddingTop: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)', // Sleek capsule background for the active tab
  },
  navLabel: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navLabelActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gold,
    marginTop: 2,
  },
});
