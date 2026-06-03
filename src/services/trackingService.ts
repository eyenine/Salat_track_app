import { getDB } from '../db/database';
import { PrayerCode, PrayerStatus, DailyPrayerLog, PRAYER_ORDER } from '../types/prayer';

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM user_settings WHERE key = ?',
    [key]
  );
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM user_settings'
  );
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key] = r.value;
  return result;
}

export async function markPrayer(
  prayerDate: string,
  prayerCode: PrayerCode,
  status: PrayerStatus,
  prayedAt?: string
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO daily_prayer_log (prayer_date, prayer_code, status, prayed_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(prayer_date, prayer_code) DO UPDATE SET
       status = excluded.status,
       prayed_at = excluded.prayed_at,
       updated_at = CURRENT_TIMESTAMP`,
    [prayerDate, prayerCode, status, prayedAt ?? null]
  );
}

export async function getDailyLog(date: string): Promise<DailyPrayerLog[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    `SELECT m.code as prayerCode, m.name, COALESCE(l.status, 'PENDING') as status,
            l.prayed_at as prayedAt, l.scheduled_time as scheduledTime, l.note
     FROM prayer_master m
     LEFT JOIN daily_prayer_log l ON m.code = l.prayer_code AND l.prayer_date = ?
     ORDER BY m.display_order`,
    [date]
  );
  return rows.map((r: any) => ({ ...r, prayerDate: date }));
}

export async function getMonthlyStats(year: number, month: number) {
  const db = await getDB();
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const rows = await db.getAllAsync<any>(
    `SELECT prayer_code, status, COUNT(*) as count
     FROM daily_prayer_log
     WHERE prayer_date LIKE ?
     GROUP BY prayer_code, status`,
    [`${monthStr}%`]
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const total = daysInMonth * 5;
  let completed = 0;

  const byPrayer: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!byPrayer[row.prayer_code]) byPrayer[row.prayer_code] = {};
    byPrayer[row.prayer_code][row.status] = row.count;
    if (['ON_TIME', 'LATE', 'QAZA', 'EXCUSED'].includes(row.status)) {
      completed += row.count;
    }
  }

  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
    byPrayer,
  };
}

export async function getStreak(today: string): Promise<number> {
  const db = await getDB();
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const rows = await db.getAllAsync<any>(
      `SELECT status FROM daily_prayer_log WHERE prayer_date = ?`,
      [dateStr]
    );

    const completedCount = rows.filter((r: any) =>
      ['ON_TIME', 'LATE', 'QAZA', 'EXCUSED'].includes(r.status)
    ).length;

    if (completedCount === 5) {
      streak++;
    } else if (i > 0) {
      break;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
