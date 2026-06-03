import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAllSettings } from './trackingService';
import { calculatePrayerTimes, CalculationMethodName } from './prayerTimeService';

// Set up the default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests permission for sending local push notifications.
 * Returns true if permissions are granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for local notifications!');
    return false;
  }
  
  // Set up an Android-specific channel for high importance notifications
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('salat-reminders', {
      name: 'Salat Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });
  }

  return true;
}

/**
 * Cancels all current scheduled notifications and re-schedules them
 * for the next 7 days based on the user's current settings.
 */
export async function schedulePrayerNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  // 1. Clear all previously scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Load the user's latest settings
  const settings = await getAllSettings();
  const isEnabled = settings['notification_enabled'] !== 'false';
  if (!isEnabled) {
    console.log('Notifications are disabled in settings.');
    return;
  }

  const lat = parseFloat(settings['latitude'] || '23.8103');
  const lng = parseFloat(settings['longitude'] || '90.4125');
  const method = (settings['calculation_method'] || 'MuslimWorldLeague') as CalculationMethodName;
  const preReminderMins = parseInt(settings['pre_reminder_minutes'] || '10', 10);

  const now = new Date();
  const prayerCodes: { code: 'FAJR' | 'DHUHR' | 'ASR' | 'MAGHRIB' | 'ISHA'; name: string }[] = [
    { code: 'FAJR', name: 'Fajr' },
    { code: 'DHUHR', name: 'Dhuhr' },
    { code: 'ASR', name: 'Asr' },
    { code: 'MAGHRIB', name: 'Maghrib' },
    { code: 'ISHA', name: 'Isha' },
  ];

  let scheduleCount = 0;

  // 3. Loop over the next 7 days and schedule
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);

    // Calculate prayer times for this day
    const times = calculatePrayerTimes(lat, lng, targetDate, method);

    for (const p of prayerCodes) {
      let prayerTime: Date;
      switch (p.code) {
        case 'FAJR': prayerTime = times.fajr; break;
        case 'DHUHR': prayerTime = times.dhuhr; break;
        case 'ASR': prayerTime = times.asr; break;
        case 'MAGHRIB': prayerTime = times.maghrib; break;
        case 'ISHA': prayerTime = times.isha; break;
      }

      // Check that the calculated time is valid and in the future
      if (prayerTime && prayerTime > now) {
        // Schedule standard prayer time notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 Time for ${p.name}`,
            body: `It is now time for ${p.name} prayer. Tap to track your Salat!`,
            sound: true,
            data: { screen: 'index' },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayerTime,
          },
        });
        scheduleCount++;
      }

      // Schedule pre-reminder if enabled and configured
      if (preReminderMins > 0 && prayerTime) {
        const preTime = new Date(prayerTime.getTime() - preReminderMins * 60000);
        if (preTime > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `📢 ${p.name} in ${preReminderMins} mins`,
              body: `${p.name} prayer starts in ${preReminderMins} minutes. Prepare for Wudu!`,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: preTime,
            },
          });
          scheduleCount++;
        }
      }
    }
  }

  console.log(`Successfully scheduled ${scheduleCount} local salat reminders.`);
}
