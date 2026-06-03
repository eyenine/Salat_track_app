import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Switch, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getAllSettings, setSetting } from '../src/services/trackingService';
import { useStore } from '../src/store/useStore';
import { schedulePrayerNotifications } from '../src/services/notificationService';
import { COLORS, SHADOWS } from '../src/constants/theme';
import BottomNavBar from '../src/components/BottomNavBar';

const CALCULATION_METHODS = [
  { key: 'MuslimWorldLeague', label: 'Muslim World League' },
  { key: 'Egyptian', label: 'Egyptian General Authority' },
  { key: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
  { key: 'UmmAlQura', label: 'Umm Al-Qura, Makkah' },
  { key: 'NorthAmerica', label: 'ISNA (North America)' },
  { key: 'Kuwait', label: 'Kuwait' },
  { key: 'Qatar', label: 'Qatar' },
  { key: 'Singapore', label: 'Singapore' },
];

const PRE_REMINDER_OPTIONS = [
  { key: '0', label: 'None' },
  { key: '5', label: '5 min' },
  { key: '10', label: '10 min' },
  { key: '15', label: '15 min' },
  { key: '30', label: '30 min' },
];

export default function SettingsScreen() {
  const { setSettings } = useStore();
  const [settings, setLocalSettings] = useState<Record<string, string>>({});
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    async function load() {
      const s = await getAllSettings();
      setLocalSettings(s);
      setLatInput(s.latitude || '23.8103');
      setLngInput(s.longitude || '90.4125');
      setCityInput(s.city_name || 'Dhaka');
    }
    load();
  }, []);

  const save = async (key: string, value: string) => {
    await setSetting(key, value);
    const updated = { ...settings, [key]: value };
    setLocalSettings(updated);
    setSettings(updated);

    // Reschedule notifications to reflect new settings immediately
    try {
      await schedulePrayerNotifications();
    } catch (e) {
      console.log('Error rescheduling notifications:', e);
    }
  };

  const handleDetectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permissions are required to auto-detect coordinates.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude.toFixed(4);
      const lng = loc.coords.longitude.toFixed(4);
      
      setLatInput(lat);
      setLngInput(lng);

      // Attempt to reverse geocode city name
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const city = geocode[0].city || geocode[0].region || geocode[0].subregion || 'My Location';
        setCityInput(city);
        Alert.alert('Success', `Detected Location: ${city} (${lat}, ${lng})`);
      } else {
        setCityInput('Detected Location');
        Alert.alert('Success', `Detected Location: (${lat}, ${lng})`);
      }
    } catch (error: any) {
      Alert.alert('Error Detecting Location', error.message || 'Could not fetch coordinates.');
    } finally {
      setDetecting(false);
    }
  };

  const saveLocation = async () => {
    setSavingLocation(true);
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      setSavingLocation(false);
      return;
    }
    
    await setSetting('latitude', latInput);
    await setSetting('longitude', lngInput);
    await setSetting('city_name', cityInput);
    
    const updated = {
      ...settings,
      latitude: latInput,
      longitude: lngInput,
      city_name: cityInput,
    };
    setLocalSettings(updated);
    setSettings(updated);

    try {
      // Recalculating times and rescheduling reminders
      await schedulePrayerNotifications();
      Alert.alert('✅ Settings Saved', 'Location updated. Prayer times and reminders have been recalculated.');
    } catch (e) {
      Alert.alert('✅ Settings Saved', 'Location saved (notification reschedule pending).');
    } finally {
      setSavingLocation(false);
    }
  };

  const isNotificationsEnabled = settings.notification_enabled !== 'false';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Location Section */}
        <View style={[styles.section, SHADOWS.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="location" size={16} color={COLORS.gold} />
            </View>
            <Text style={styles.sectionTitle}>Location Settings</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Configure your city name and geographic coordinates to accurately calculate prayer times.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>City Name</Text>
            <TextInput
              style={styles.input}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder="e.g. Dhaka"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latInput}
                onChangeText={setLatInput}
                keyboardType="numeric"
                placeholder="23.8103"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={lngInput}
                onChangeText={setLngInput}
                keyboardType="numeric"
                placeholder="90.4125"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.locationActionButtons}>
            <TouchableOpacity 
              style={[styles.detectBtn, detecting && styles.btnDisabled]} 
              onPress={handleDetectLocation}
              disabled={detecting}
              activeOpacity={0.7}
            >
              {detecting ? (
                <ActivityIndicator size="small" color={COLORS.gold} />
              ) : (
                <>
                  <Ionicons name="navigate" size={15} color={COLORS.gold} />
                  <Text style={styles.detectBtnText}>Detect GPS</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveBtn, { flex: 1.5 }, savingLocation && styles.btnDisabled]} 
              onPress={saveLocation}
              disabled={savingLocation}
              activeOpacity={0.8}
            >
              {savingLocation ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Coordinates</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, SHADOWS.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="notifications" size={16} color={COLORS.gold} />
            </View>
            <Text style={styles.sectionTitle}>Reminders & Alerts</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Control when and how you receive local notifications for daily prayers.
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable Daily Salat Reminders</Text>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={(val) => save('notification_enabled', val ? 'true' : 'false')}
              trackColor={{ false: COLORS.border, true: COLORS.primaryDark }}
              thumbColor={isNotificationsEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          {isNotificationsEnabled && (
            <View style={styles.preReminderBox}>
              <Text style={styles.label}>Pre-Reminder Time</Text>
              <Text style={styles.preReminderSub}>
                Remind me to prepare (Wudu/Ablution) before the prayer starts:
              </Text>
              <View style={styles.segmentContainer}>
                {PRE_REMINDER_OPTIONS.map((opt) => {
                  const isSelected = (settings.pre_reminder_minutes || '10') === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.segmentBtn, isSelected && styles.segmentBtnSelected]}
                      onPress={() => save('pre_reminder_minutes', opt.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentBtnText, isSelected && styles.segmentBtnTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Calculation Method */}
        <View style={[styles.section, SHADOWS.card]}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="calculator" size={16} color={COLORS.gold} />
            </View>
            <Text style={styles.sectionTitle}>Calculation Method</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Select the convention used to determine Fajr and Isha angle methods.
          </Text>

          {CALCULATION_METHODS.map(m => {
            const isSelected = settings.calculation_method === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.methodOption,
                  isSelected && styles.methodSelected,
                ]}
                onPress={() => save('calculation_method', m.key)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.radio,
                  isSelected && styles.radioSelected,
                ]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[
                  styles.methodLabel,
                  isSelected && styles.methodLabelSelected,
                ]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* App Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="ribbon" size={24} color={COLORS.gold} />
          </View>
          <Text style={styles.infoTitle}>Salat Tracker App</Text>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoTextSub}>Offline-First • No Tracking • No Cloud Account Needed</Text>
          <Text style={styles.infoTextSub}>Prayer calculations powered by Adhan.js library</Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation */}
      <BottomNavBar activeRoute="settings" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    margin: 16,
    padding: 18,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSoft,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 16,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  locationActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  detectBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
  },
  detectBtnText: {
    color: COLORS.gold,
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  preReminderBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  preReminderSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 16.5,
    fontWeight: '500',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentBtnSelected: {
    backgroundColor: COLORS.primaryDark,
  },
  segmentBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  segmentBtnTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: COLORS.primary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  methodLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    fontWeight: '600',
  },
  methodLabelSelected: {
    color: COLORS.textSoft,
    fontWeight: '700',
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gold,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11.5,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  infoTextSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 3,
    fontWeight: '500',
  },
});
