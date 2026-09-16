export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  const result = await Notification.requestPermission();
  return result;
}

export async function showLocalNotification(title: string, body: string, tag = 'rumbo-reminder'): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  const options = { body, icon: '/icons/icon-192x192.png', badge: '/icons/icon-192x192.png', tag };
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

const SHOWN_KEY_PREFIX = 'rumbo_reminder_shown_';
const shownThisSession = new Set<string>();

export function wasReminderShownToday(userId: string, reminderType: string): boolean {
  const today = guatemalaDateString();
  const key = `${SHOWN_KEY_PREFIX}${userId}_${reminderType}`;
  if (shownThisSession.has(`${key}_${today}`)) return true;
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(key) === today; }
  catch { return false; }
}

export function markReminderShown(userId: string, reminderType: string): void {
  const today = guatemalaDateString();
  const key = `${SHOWN_KEY_PREFIX}${userId}_${reminderType}`;
  shownThisSession.add(`${key}_${today}`);
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, today); } catch { /* session memory prevents duplicates */ }
}

export function isTimeDue(targetTime: string, offsetMinutes = 0): boolean {
  const current = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(current.map((part) => [part.type, part.value]));
  const currentMinutes = Number(values.hour) * 60 + Number(values.minute);
  const [hour, minute] = targetTime.split(':').map(Number);
  return currentMinutes >= hour * 60 + minute + offsetMinutes;
}

export const isTimeMatch = isTimeDue;

export function isDayMatch(targetDay: string): boolean {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: APP_TIME_ZONE, weekday: 'long' })
    .format(new Date()).toLowerCase();
  return day === targetDay.toLowerCase();
}
import { APP_TIME_ZONE, guatemalaDateString } from '../utils/date';
