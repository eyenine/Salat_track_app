export type PrayerCode = 'FAJR' | 'DHUHR' | 'ASR' | 'MAGHRIB' | 'ISHA';

export type PrayerStatus =
  | 'PENDING'
  | 'ON_TIME'
  | 'LATE'
  | 'QAZA'
  | 'MISSED'
  | 'EXCUSED';

export const PRAYER_NAMES: Record<PrayerCode, string> = {
  FAJR: 'Fajr',
  DHUHR: 'Dhuhr',
  ASR: 'Asr',
  MAGHRIB: 'Maghrib',
  ISHA: 'Isha',
};

export const PRAYER_ORDER: PrayerCode[] = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA'];

export const STATUS_COLORS: Record<PrayerStatus, string> = {
  PENDING: '#94a3b8',
  ON_TIME: '#10b981',
  LATE: '#f59e0b',
  QAZA: '#8b5cf6',
  MISSED: '#ef4444',
  EXCUSED: '#64748b',
};

export const STATUS_LABELS: Record<PrayerStatus, string> = {
  PENDING: 'Pending',
  ON_TIME: 'On Time ✓',
  LATE: 'Late',
  QAZA: 'Qaza',
  MISSED: 'Missed',
  EXCUSED: 'Excused',
};

export const STATUS_EMOJIS: Record<PrayerStatus, string> = {
  PENDING: '⏳',
  ON_TIME: '✅',
  LATE: '🕐',
  QAZA: '🔄',
  MISSED: '❌',
  EXCUSED: '🤒',
};

export interface DailyPrayerLog {
  id?: number;
  prayerDate: string;
  prayerCode: PrayerCode;
  status: PrayerStatus;
  prayedAt?: string;
  scheduledTime?: string;
  note?: string;
}

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}
