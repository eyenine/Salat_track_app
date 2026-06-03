import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMonthlyStats, getStreak, getDailyLog } from '../src/services/trackingService';
import { PRAYER_NAMES, PRAYER_ORDER, STATUS_LABELS, PrayerCode, PrayerStatus } from '../src/types/prayer';
import { COLORS, SHADOWS } from '../src/constants/theme';
import BottomNavBar from '../src/components/BottomNavBar';

interface WeeklyChartItem {
  dayLabel: string;
  completedCount: number;
}

export default function DashboardScreen() {
  const today = new Date();
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth() + 1);
  const [stats, setStats] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [weeklyChartData, setWeeklyChartData] = useState<WeeklyChartItem[]>([]);

  useEffect(() => {
    async function load() {
      const s = await getMonthlyStats(year, month);
      setStats(s);
      const str = await getStreak(today.toISOString().split('T')[0]);
      setStreak(str);
      const logs = await getDailyLog(today.toISOString().split('T')[0]);
      setTodayLogs(logs);

      // Fetch last 7 days completion for the bar chart
      const chartItems: WeeklyChartItem[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLogs = await getDailyLog(dateStr);
        const completedCount = dayLogs.filter(l => 
          ['ON_TIME', 'LATE', 'QAZA'].includes(l.status)
        ).length;
        chartItems.push({
          dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
          completedCount,
        });
      }
      setWeeklyChartData(chartItems);
    }
    load();
  }, []);

  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getPrayerStat = (code: string) => {
    if (!stats?.byPrayer?.[code]) return { onTime: 0, late: 0, qaza: 0, missed: 0 };
    const p = stats.byPrayer[code];
    return {
      onTime: p['ON_TIME'] || 0,
      late: p['LATE'] || 0,
      qaza: p['QAZA'] || 0,
      missed: p['MISSED'] || 0,
    };
  };

  const getBestPrayer = () => {
    if (!stats) return null;
    let best = { code: '', total: -1 };
    for (const code of PRAYER_ORDER) {
      const s = getPrayerStat(code);
      const total = s.onTime + s.late + s.qaza;
      if (total > best.total) best = { code, total };
    }
    return best.code || null;
  };

  const getWeakestPrayer = () => {
    if (!stats) return null;
    let worst = { code: '', missed: -1 };
    for (const code of PRAYER_ORDER) {
      const s = getPrayerStat(code);
      if (s.missed > worst.missed) worst = { code, missed: s.missed };
    }
    return worst.code || null;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Monthly Overview Ring/Card */}
        <View style={[styles.bigCard, SHADOWS.emerald]}>
          <Text style={styles.monthLabel}>{monthName} OVERVIEW</Text>
          <Text style={styles.bigPct}>{stats?.percentage ?? 0}%</Text>
          <Text style={styles.bigLabel}>Monthly Completion</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${stats?.percentage ?? 0}%` as any }]} />
          </View>
          <Text style={styles.subLabel}>
            {stats?.completed ?? 0} of {stats?.total ?? 150} prayers completed
          </Text>
        </View>

        {/* Key Stats Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, SHADOWS.card]}>
            <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
              <Ionicons name="flame" size={18} color={COLORS.gold} />
            </View>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={[styles.statCard, SHADOWS.card]}>
            <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <Ionicons name="star" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>
              {getBestPrayer() ? PRAYER_NAMES[getBestPrayer() as PrayerCode] : '-'}
            </Text>
            <Text style={styles.statLabel}>Most Consistent</Text>
          </View>
          
          <View style={[styles.statCard, SHADOWS.card]}>
            <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(244, 63, 94, 0.08)' }]}>
              <Ionicons name="warning-outline" size={18} color={COLORS.STATUS.MISSED} />
            </View>
            <Text style={styles.statValue}>
              {getWeakestPrayer() ? PRAYER_NAMES[getWeakestPrayer() as PrayerCode] : '-'}
            </Text>
            <Text style={styles.statLabel}>Needs Focus</Text>
          </View>
        </View>

        {/* 7-Day Completion Bar Chart */}
        <Text style={styles.sectionTitle}>Last 7 Days Progress</Text>
        <View style={[styles.chartCard, SHADOWS.card]}>
          <View style={styles.chartContainer}>
            {weeklyChartData.map((item, idx) => {
              // Height multiplier: Max completed is 5 prayers. 
              // 5 * 15px = 75px max height.
              const barHeight = item.completedCount * 15;
              const isPerfect = item.completedCount === 5;
              
              return (
                <View key={idx} style={styles.chartColumn}>
                  <Text style={[styles.chartCountText, isPerfect && { color: COLORS.gold, fontWeight: '800' }]}>
                    {item.completedCount}
                  </Text>
                  {/* Outer capsule track */}
                  <View style={styles.barTrack}>
                    <View 
                      style={[
                        styles.chartBar, 
                        { height: Math.max(4, barHeight) }, 
                        isPerfect ? { backgroundColor: COLORS.gold } : { backgroundColor: COLORS.primary }
                      ]} 
                    />
                  </View>
                  <Text style={styles.chartDayText}>{item.dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Monthly breakdown list */}
        <Text style={styles.sectionTitle}>Monthly Breakdown — {monthName}</Text>
        {PRAYER_ORDER.map(code => {
          const s = getPrayerStat(code);
          const total = s.onTime + s.late + s.qaza + s.missed;
          const pct = total > 0 ? Math.round(((s.onTime + s.late + s.qaza) / (total || 1)) * 100) : 0;
          
          return (
            <View key={code} style={[styles.breakdownCard, SHADOWS.card]}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownName}>{PRAYER_NAMES[code as PrayerCode]}</Text>
                <Text style={styles.breakdownPct}>{pct}%</Text>
              </View>
              
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` as any }]} />
              </View>
              
              <View style={styles.breakdownStats}>
                <Text style={[styles.breakdownMiniText, { color: COLORS.STATUS.ON_TIME }]}>
                  ● {s.onTime} On Time
                </Text>
                <Text style={[styles.breakdownMiniText, { color: COLORS.STATUS.LATE }]}>
                  ● {s.late} Late
                </Text>
                <Text style={[styles.breakdownMiniText, { color: COLORS.STATUS.QAZA }]}>
                  ● {s.qaza} Qaza
                </Text>
                <Text style={[styles.breakdownMiniText, { color: COLORS.STATUS.MISSED }]}>
                  ● {s.missed} Missed
                </Text>
              </View>
            </View>
          );
        })}

        {/* Today's Snapshot */}
        <Text style={styles.sectionTitle}>Today's Snapshot</Text>
        <View style={[styles.snapshotCard, SHADOWS.card]}>
          {todayLogs.map(log => {
            const status: PrayerStatus = log.status;
            return (
              <View key={log.prayerCode} style={styles.snapshotRow}>
                <Text style={styles.snapshotPrayer}>{PRAYER_NAMES[log.prayerCode as PrayerCode]}</Text>
                <View style={[styles.snapshotBadge, { backgroundColor: COLORS.STATUS[status] + '12' }]}>
                  <Text style={[styles.snapshotStatus, { color: COLORS.STATUS[status] }]}>
                    {STATUS_LABELS[status] || status}
                  </Text>
                </View>
              </View>
            );
          })}
          {todayLogs.length === 0 && (
            <Text style={styles.emptyText}>No logs recorded for today yet.</Text>
          )}
        </View>

      </ScrollView>

      {/* Floating Bottom Navigation */}
      <BottomNavBar activeRoute="dashboard" />
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
  bigCard: {
    margin: 16,
    padding: 22,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  monthLabel: {
    color: COLORS.textSoft,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  bigPct: {
    color: COLORS.goldGlow,
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 66,
    marginVertical: 6,
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  bigLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  barBg: {
    width: '100%',
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  barFill: {
    height: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  subLabel: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    marginTop: 10,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 3,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 10,
  },
  chartCard: {
    marginHorizontal: 16,
    padding: 18,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  chartCountText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginBottom: 5,
    fontWeight: '700',
  },
  barTrack: {
    height: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Premium background track capsule
    borderRadius: 8,
    justifyContent: 'flex-end',
    width: 14,
    overflow: 'hidden',
  },
  chartBar: {
    width: 14,
    borderRadius: 8,
  },
  chartDayText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '700',
  },
  breakdownCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  breakdownPct: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  breakdownStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 4,
  },
  breakdownMiniText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  snapshotCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  snapshotPrayer: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  snapshotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  snapshotStatus: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 12,
    paddingVertical: 14,
    fontWeight: '500',
  },
});
