import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('salat.db');
  }
  return db;
}

export async function initDB() {
  const database = await getDB();

  await database.execAsync(`PRAGMA journal_mode = WAL;`);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS prayer_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_prayer_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prayer_date TEXT NOT NULL,
      prayer_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      prayed_at TEXT,
      scheduled_time TEXT,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(prayer_date, prayer_code)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO prayer_master (code, name, display_order) VALUES
      ('FAJR', 'Fajr', 1),
      ('DHUHR', 'Dhuhr', 2),
      ('ASR', 'Asr', 3),
      ('MAGHRIB', 'Maghrib', 4),
      ('ISHA', 'Isha', 5);

    INSERT OR IGNORE INTO user_settings (key, value) VALUES
      ('calculation_method', 'MuslimWorldLeague'),
      ('latitude', '23.8103'),
      ('longitude', '90.4125'),
      ('city_name', 'Dhaka'),
      ('notification_enabled', 'true'),
      ('pre_reminder_minutes', '10');
  `);
}
