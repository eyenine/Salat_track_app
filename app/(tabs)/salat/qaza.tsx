import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDB } from '../../../src/db/database';
import { PRAYER_NAMES, PrayerCode } from '../../../src/types/prayer';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
// BottomNavBar removed - using tab navigator

interface QazaEntry {
  prayer_code: string;
  total_due: number;
  completed: number;
}

export default function QazaScreen() {
  const [qazaData, setQazaData] = useState<QazaEntry[]>([]);

  const load = async () => {
    const db = await getDB();

    // Ensure qaza_plan table exists
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS qaza_plan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prayer_code TEXT NOT NULL UNIQUE,
        total_due INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO qaza_plan (prayer_code) VALUES
        ('FAJR'), ('DHUHR'), ('ASR'), ('MAGHRIB'), ('ISHA');
    `);

    const rows = await db.getAllAsync<QazaEntry>(
      'SELECT * FROM qaza_plan ORDER BY CASE prayer_code WHEN "FAJR" THEN 1 WHEN "DHUHR" THEN 2 WHEN "ASR" THEN 3 WHEN "MAGHRIB" THEN 4 ELSE 5 END'
    );
    setQazaData(rows);
  };

  useEffect(() => {
    load();
  }, []);

  const adjustDue = async (code: string, amount: number) => {
    const db = await getDB();
    await db.runAsync(`
      UPDATE qaza_plan
      SET total_due = CASE WHEN total_due + ? < completed THEN completed ELSE total_due + ? END,
          updated_at = CURRENT_TIMESTAMP
      WHERE prayer_code = ?`, 
      [amount, amount, code]
    );
    load();
  };

  const markDone = async (code: string) => {
    const db = await getDB();
    await db.runAsync(`
      UPDATE qaza_plan
      SET completed = CASE WHEN completed + 1 > total_due THEN total_due ELSE completed + 1 END,
          updated_at = CURRENT_TIMESTAMP
      WHERE prayer_code = ?`, 
      [code]
    );
    load();
  };

  const decrementCompleted = async (code: string) => {
    const db = await getDB();
    await db.runAsync(`
      UPDATE qaza_plan
      SET completed = CASE WHEN completed - 1 < 0 THEN 0 ELSE completed - 1 END,
          updated_at = CURRENT_TIMESTAMP
      WHERE prayer_code = ?`, 
      [code]
    );
    load();
  };

  const totalRemaining = qazaData.reduce((s, q) => s + Math.max(0, q.total_due - q.completed), 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Summary Card */}
        <View style={[styles.headerCard, SHADOWS.gold]}>
          <Text style={styles.headerTitle}>Total Qaza Prayers Owed</Text>
          <Text style={styles.totalDue}>{totalRemaining}</Text>
          <Text style={styles.totalLabel}>Prayers remaining to recover</Text>
        </View>

        <Text style={styles.sectionTitle}>Qaza Tracker by Prayer</Text>

        {/* Qaza Cards */}
        {qazaData.map(q => {
          const remaining = Math.max(0, q.total_due - q.completed);
          const pct = q.total_due > 0 ? Math.round((q.completed / q.total_due) * 100) : 0;
          
          return (
            <View key={q.prayer_code} style={[styles.card, SHADOWS.card]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.prayerName}>{PRAYER_NAMES[q.prayer_code as PrayerCode]}</Text>
                  <Text style={styles.progressText}>
                    Recovered {q.completed} of {q.total_due} ({pct}%)
                  </Text>
                </View>
                <View style={styles.remainingBadge}>
                  <Text style={styles.remainingCount}>{remaining}</Text>
                  <Text style={styles.remainingLabel}>Owed</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%` as any }]} />
              </View>

              {/* Adjust Total Due controls */}
              <View style={styles.adjustRow}>
                <Text style={styles.controlLabel}>Modify Owed</Text>
                <View style={styles.controlRight}>
                  <View style={styles.counterGroup}>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustDue(q.prayer_code, -1)} activeOpacity={0.7}>
                      <Ionicons name="remove" size={14} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.dueNum}>{q.total_due}</Text>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustDue(q.prayer_code, 1)} activeOpacity={0.7}>
                      <Ionicons name="add" size={14} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.quickAddGroup}>
                    <TouchableOpacity style={styles.quickAddBtn} onPress={() => adjustDue(q.prayer_code, 5)} activeOpacity={0.7}>
                      <Text style={styles.quickAddText}>+5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickAddBtn} onPress={() => adjustDue(q.prayer_code, 10)} activeOpacity={0.7}>
                      <Text style={styles.quickAddText}>+10</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Recovery Action Buttons */}
              <View style={styles.btnRow}>
                {q.completed > 0 && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.undoBtn]} 
                    onPress={() => decrementCompleted(q.prayer_code)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-undo" size={14} color={COLORS.textMuted} />
                    <Text style={styles.undoBtnText}>Undo</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[
                    styles.actionBtn, 
                    styles.doneBtn, 
                    remaining === 0 && styles.doneBtnDisabled
                  ]} 
                  onPress={() => markDone(q.prayer_code)}
                  disabled={remaining === 0}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={15} color={remaining === 0 ? COLORS.textMuted : '#ffffff'} />
                  <Text style={[styles.doneBtnText, remaining === 0 && styles.doneBtnTextDisabled]}>
                    Prayed Qaza
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Informational Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>
            <Ionicons name="book" size={15} color={COLORS.gold} /> Qaza Guide & Tips
          </Text>
          <Text style={styles.tipText}>
            1. Use the <Text style={{ fontWeight: 'bold', color: COLORS.text }}>Modify Owed</Text> selectors to set the number of prayers you need to make up.
          </Text>
          <Text style={styles.tipText}>
            2. After performing a Qaza prayer, tap <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>Prayed Qaza</Text> to record it.
          </Text>
          <Text style={styles.tipText}>
            3. Consistency is key! Dedicate a specific time (e.g. after every daily obligatory prayer) to offer one Qaza.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Sticky Tab Bar */}
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
  headerCard: {
    margin: 16,
    padding: 22,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  headerTitle: {
    color: COLORS.textSoft,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  totalDue: {
    color: COLORS.goldGlow,
    fontSize: 58,
    fontWeight: '900',
    lineHeight: 66,
    marginVertical: 6,
    textShadowColor: 'rgba(251, 191, 36, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  totalLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2.5,
    fontWeight: '500',
  },
  remainingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 52,
  },
  remainingCount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gold,
  },
  remainingLabel: {
    fontSize: 8,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  barBg: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  barFill: {
    height: 7,
    backgroundColor: '#8b5cf6', // Purple color for Qaza progress
    borderRadius: 4,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  controlLabel: {
    fontSize: 11.5,
    color: COLORS.textSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 2,
  },
  adjustBtn: {
    padding: 6,
    borderRadius: 8,
  },
  dueNum: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '700',
    paddingHorizontal: 8,
    textAlign: 'center',
    minWidth: 28,
  },
  quickAddGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  quickAddBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickAddText: {
    color: COLORS.textSoft,
    fontSize: 10,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  undoBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  undoBtnText: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  doneBtn: {
    flex: 2,
    backgroundColor: COLORS.primaryDark,
  },
  doneBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  doneBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  doneBtnTextDisabled: {
    color: COLORS.textMuted,
  },
  tipCard: {
    margin: 16,
    padding: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.02)', // Soft gold tint card
    borderRadius: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  tipTitle: {
    fontWeight: '800',
    color: COLORS.gold,
    marginBottom: 8,
    fontSize: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tipText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    lineHeight: 16.5,
    marginBottom: 6,
    fontWeight: '500',
  },
});


