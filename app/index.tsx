import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Qibla, Coordinates } from 'adhan';
import { useStore } from '../src/store/useStore';
import { getDailyLog, markPrayer, getSetting, getStreak } from '../src/services/trackingService';
import { calculatePrayerTimes, formatTime, getNextPrayer, getTimeUntil } from '../src/services/prayerTimeService';
import {
  PrayerCode, PrayerStatus,
  STATUS_LABELS, STATUS_EMOJIS, PRAYER_ORDER, PRAYER_NAMES
} from '../src/types/prayer';
import { COLORS, SHADOWS } from '../src/constants/theme';
import BottomNavBar from '../src/components/BottomNavBar';

const COMPLETED_STATUSES: PrayerStatus[] = ['ON_TIME', 'LATE', 'QAZA'];

// Helper to translate degrees into compass direction
function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

export default function HomeScreen() {
  const { currentDate, setCurrentDate, refreshKey, triggerRefresh } = useStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [cityName, setCityName] = useState('');
  const [qiblaHeading, setQiblaHeading] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const logsData = await getDailyLog(currentDate);
    setLogs(logsData);

    const lat = parseFloat((await getSetting('latitude')) || '23.8103');
    const lng = parseFloat((await getSetting('longitude')) || '90.4125');
    const city = (await getSetting('city_name')) || 'Dhaka';
    const method = (await getSetting('calculation_method')) as any || 'MuslimWorldLeague';
    setCityName(city);

    const times = calculatePrayerTimes(lat, lng, new Date(currentDate), method);
    setPrayerTimes(times);

    // Qibla direction from Adhan
    const qiblaHeadingVal = Qibla(new Coordinates(lat, lng));
    setQiblaHeading(qiblaHeadingVal);

    const s = await getStreak(new Date().toISOString().split('T')[0]);
    setStreak(s);
  }, [currentDate, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const completed = logs.filter(l => COMPLETED_STATUSES.includes(l.status)).length;
  const completionPct = Math.round((completed / 5) * 100);
  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes, now) : null;

  const handleMark = (code: PrayerCode, status: PrayerStatus) => {
    Alert.alert(
      `Mark ${PRAYER_NAMES[code]}`,
      `Set status to: ${STATUS_LABELS[status]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            await markPrayer(currentDate, code, status, new Date().toISOString());
            triggerRefresh();
          },
        },
      ]
    );
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date().toISOString().split('T')[0]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isToday = currentDate === new Date().toISOString().split('T')[0];

  const todayLabel = new Date(currentDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* Date Selector Header */}
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateNavBtn} onPress={handlePrevDay} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={COLORS.gold} />
          </TouchableOpacity>
          <View style={styles.dateLabelBox}>
            <Text style={styles.dateText}>{todayLabel}</Text>
            <Text style={styles.cityText}>
              <Ionicons name="location" size={11} color={COLORS.gold} /> {cityName}
              {qiblaHeading !== null && `  •  🕋 Qibla: ${qiblaHeading.toFixed(0)}° ${getCompassDirection(qiblaHeading)}`}
            </Text>
          </View>
          <TouchableOpacity style={styles.dateNavBtn} onPress={handleNextDay} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {!isToday && (
          <TouchableOpacity style={styles.todayResetBtn} onPress={handleGoToToday} activeOpacity={0.8}>
            <Ionicons name="today-outline" size={12} color={COLORS.gold} />
            <Text style={styles.todayResetText}>Return to Today</Text>
          </TouchableOpacity>
        )}

        {/* Next Prayer Glowing Card */}
        <View style={[styles.headerCard, SHADOWS.emerald]}>
          {nextPrayer ? (
            <View style={styles.nextPrayerBox}>
              <View style={styles.nextPrayerBadge}>
                <Text style={styles.nextPrayerLabel}>Next Prayer</Text>
              </View>
              <Text style={styles.nextPrayerName}>{nextPrayer.name}</Text>
              <View style={styles.nextPrayerTimeBox}>
                <Ionicons name="time" size={13} color={COLORS.textSoft} />
                <Text style={styles.nextPrayerTime}>{formatTime(nextPrayer.time)}</Text>
              </View>
              <Text style={styles.countdown}>{getTimeUntil(nextPrayer.time, now)}</Text>
            </View>
          ) : (
            <View style={styles.nextPrayerBox}>
              <View style={styles.moonIconContainer}>
                <Ionicons name="moon" size={36} color={COLORS.goldGlow} />
              </View>
              <Text style={styles.nextPrayerLabel}>All prayers completed</Text>
              <Text style={styles.allDoneGreeting}>Alhamdulillah 🌙</Text>
            </View>
          )}
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, SHADOWS.card]}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Completion Progress</Text>
            <Text style={styles.progressPct}>{completionPct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${completionPct}%` as any }]} />
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNum}>{completed}/5</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="flame" size={18} color={COLORS.gold} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNum}>{streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Prayer Times Section */}
        <Text style={styles.sectionTitle}>Daily Prayers</Text>
        
        {PRAYER_ORDER.map((code) => {
          const log = logs.find(l => l.prayerCode === code);
          const status: PrayerStatus = log?.status || 'PENDING';
          const timeMap: Record<PrayerCode, keyof typeof prayerTimes> = {
            FAJR: 'fajr', DHUHR: 'dhuhr', ASR: 'asr', MAGHRIB: 'maghrib', ISHA: 'isha',
          };
          const time = prayerTimes ? formatTime(prayerTimes[timeMap[code]]) : '--:--';

          // Visual config mapping
          const iconMap: Record<PrayerStatus, any> = {
            PENDING: 'ellipse-outline',
            ON_TIME: 'checkmark-circle',
            LATE: 'time',
            QAZA: 'refresh-circle',
            MISSED: 'close-circle',
            EXCUSED: 'shield-checkmark',
          };

          const isNext = nextPrayer && nextPrayer.name.toUpperCase() === code;

          return (
            <View key={code} style={[styles.prayerCard, SHADOWS.card, isNext && styles.prayerCardActive]}>
              <View style={styles.prayerLeft}>
                <View style={[styles.statusIconBox, { backgroundColor: COLORS.STATUS[status] + '12' }]}>
                  <Ionicons name={iconMap[status]} size={20} color={COLORS.STATUS[status]} />
                </View>
                <View>
                  <View style={styles.prayerNameRow}>
                    <Text style={styles.prayerName}>{PRAYER_NAMES[code]}</Text>
                    {isNext && (
                      <View style={styles.activeTag}>
                        <Text style={styles.activeTagText}>NEXT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.prayerTime}>{time}</Text>
                </View>
              </View>
              
              <View style={styles.prayerRight}>
                {status !== 'PENDING' ? (
                  <View style={[styles.statusBadge, { backgroundColor: COLORS.STATUS[status] + '12' }]}>
                    <Text style={[styles.statusText, { color: COLORS.STATUS[status] }]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.markButtons}>
                    <TouchableOpacity
                      style={[styles.markBtn, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}
                      onPress={() => handleMark(code, 'ON_TIME')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="checkmark" size={15} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.markBtn, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}
                      onPress={() => handleMark(code, 'LATE')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={15} color={COLORS.gold} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.markBtn, { backgroundColor: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.3)' }]}
                      onPress={() => handleMark(code, 'MISSED')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={15} color={COLORS.STATUS.MISSED} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Floating Sticky Tab Bar */}
      <BottomNavBar activeRoute="index" />
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  dateNavBtn: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateLabelBox: {
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cityText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 5,
    fontWeight: '500',
  },
  todayResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 10,
    gap: 4,
  },
  todayResetText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  headerCard: {
    margin: 16,
    padding: 22,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)', // Subtle emerald glow border
    alignItems: 'center',
  },
  nextPrayerBox: {
    alignItems: 'center',
    width: '100%',
  },
  nextPrayerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  nextPrayerLabel: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  nextPrayerName: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  nextPrayerTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  nextPrayerTime: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  countdown: {
    color: COLORS.goldGlow,
    fontSize: 38,
    fontWeight: '300',
    letterSpacing: 3,
    marginTop: 12,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  moonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.15)',
  },
  allDoneGreeting: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  progressCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13.5,
    color: COLORS.text,
    fontWeight: '700',
  },
  progressPct: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  progressBarFill: {
    height: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
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
  prayerCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prayerCardActive: {
    borderColor: 'rgba(245, 158, 11, 0.25)', // Active indicator glow border
    backgroundColor: 'rgba(24, 32, 42, 0.4)',
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  activeTagText: {
    color: COLORS.gold,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  prayerTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  prayerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  markButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  markBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
