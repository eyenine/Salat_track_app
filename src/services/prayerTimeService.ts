import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';

export type CalculationMethodName =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore';

function getMethod(name: CalculationMethodName) {
  switch (name) {
    case 'Egyptian': return CalculationMethod.Egyptian();
    case 'Karachi': return CalculationMethod.Karachi();
    case 'UmmAlQura': return CalculationMethod.UmmAlQura();
    case 'NorthAmerica': return CalculationMethod.NorthAmerica();
    case 'Kuwait': return CalculationMethod.Kuwait();
    case 'Qatar': return CalculationMethod.Qatar();
    case 'Singapore': return CalculationMethod.Singapore();
    default: return CalculationMethod.MuslimWorldLeague();
  }
}

export function calculatePrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  method: CalculationMethodName = 'MuslimWorldLeague'
) {
  const coords = new Coordinates(latitude, longitude);
  const params = getMethod(method);
  return new PrayerTimes(coords, date, params);
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getNextPrayer(
  times: PrayerTimes,
  now: Date
): { name: string; time: Date } | null {
  const prayers = [
    { name: 'Fajr', time: times.fajr },
    { name: 'Dhuhr', time: times.dhuhr },
    { name: 'Asr', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isha', time: times.isha },
  ];
  for (const p of prayers) {
    if (p.time > now) return p;
  }
  return null;
}

export function getTimeUntil(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return '00:00:00';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
