import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDailyLog, markPrayer } from '../../../src/services/trackingService';
import { useStore } from '../../../src/store/useStore';
import {
  PrayerCode, PrayerStatus,
  STATUS_LABELS, STATUS_EMOJIS, PRAYER_ORDER, PRAYER_NAMES
} from '../../../src/types/prayer';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
// BottomNavBar removed - using tab navigator

const STATUSES: PrayerStatus[] = ['ON_TIME', 'LATE', 'QAZA', 'MISSED', 'EXCUSED'];

// Helper to generate dates for the last 7 days
function generateWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function TrackerScreen() {
  const { currentDate, setCurrentDate, triggerRefresh } = useStore();
  const [logs, setLogs] = useState<any[]>([]);
  const weekDates = generateWeekDates();

  const loadLogs = useCallback(async () => {
    const data = await getDailyLog(currentDate);
    setLogs(data);
  }, [currentDate]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleMark = (code: PrayerCode, currentStatus: PrayerStatus) => {
    Alert.alert(
      `Update ${PRAYER_NAMES[code]}`,
      'Select status:',
      [
        ...STATUSES.map(s => ({
          text: `${STATUS_EMOJIS[s]} ${STATUS_LABELS[s]}`,
          onPress: async () => {
            await markPrayer(currentDate, code, s, new Date().toISOString());
            triggerRefresh();
            loadLogs();
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const completedCount = logs.filter(l =>
    ['ON_TIME', 'LATE', 'QAZA'].includes(l.status)
  ).length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Week Calendar Picker */}
        <View style={styles.weekContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScroll} contentContainerStyle={styles.weekScrollContent}>
            {weekDates.map(date => {
              const d = new Date(date);
              const isSelected = date === currentDate;
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.dateChip,
                    SHADOWS.card,
                    isSelected && styles.dateChipSelected,
                  ]}
                  onPress={() => setCurrentDate(date)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                    {d.getDate()}
                  </Text>
                  {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date Summary Card */}
        <View style={[styles.summaryCard, SHADOWS.card]}>
          <Text style={styles.summaryDate}>
            {new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <View style={styles.summaryBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
            <Text style={styles.summaryPct}>
              {completedCount}/5 prayers completed
            </Text>
          </View>
          
          {/* Status dots indicators */}
          <View style={styles.dotRow}>
            {logs.map((l, i) => (
              <View
                key={i}
                style={[
                  styles.statusDot,
                  { backgroundColor: COLORS.STATUS[l.status as PrayerStatus] || COLORS.border },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Prayer Rows */}
        <Text style={styles.sectionTitle}>Tracked Prayers</Text>
        
        {PRAYER_ORDER.map(code => {
          const log = logs.find(l => l.prayerCode === code);
          const status: PrayerStatus = log?.status || 'PENDING';
          
          const iconMap: Record<PrayerStatus, any> = {
            PENDING: 'ellipse-outline',
            ON_TIME: 'checkmark-circle',
            LATE: 'time',
            QAZA: 'refresh-circle',
            MISSED: 'close-circle',
            EXCUSED: 'shield-checkmark',
          };

          return (
            <TouchableOpacity
              key={code}
              style={[styles.prayerRow, SHADOWS.card]}
              onPress={() => handleMark(code, status)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: COLORS.STATUS[status] + '12' }]}>
                <Ionicons name={iconMap[status]} size={22} color={COLORS.STATUS[status]} />
              </View>
              
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerName}>{PRAYER_NAMES[code]}</Text>
                {log?.prayedAt ? (
                  <Text style={styles.prayedAt}>
                    Logged at {new Date(log.prayedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                ) : (
                  <Text style={styles.prayedAt}>Tap to update status</Text>
                )}
              </View>
              
              <View style={[styles.statusPill, { backgroundColor: COLORS.STATUS[status] + '12' }]}>
                <Text style={[styles.statusPillText, { color: COLORS.STATUS[status] }]}>
                  {STATUS_LABELS[status]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.hintBox}>
          <Ionicons name="information-circle" size={15} color={COLORS.textMuted} />
          <Text style={styles.hintText}>Tap any prayer card to update or change its status.</Text>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigation */}
      {/* Tab bar handles navigation */}
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
  weekContainer: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  weekScroll: {
    paddingHorizontal: 12,
  },
  weekScrollContent: {
    paddingRight: 24,
  },
  dateChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    minWidth: 58,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayLabelSelected: {
    color: COLORS.primary,
  },
  dayNum: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  dayNumSelected: {
    color: '#ffffff',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: COLORS.gold,
  },
  summaryCard: {
    margin: 16,
    padding: 18,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryDate: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  summaryPct: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 10,
  },
  prayerRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  prayedAt: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2.5,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 18,
    paddingHorizontal: 16,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});


