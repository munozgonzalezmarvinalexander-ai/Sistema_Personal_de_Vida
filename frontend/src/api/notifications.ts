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

export function showLocalNotification(title: string, body: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  new Notification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'rumbo-reminder',
  });
  return true;
}

const SHOWN_KEY_PREFIX = 'rumbo_reminder_shown_';

export function wasReminderShownToday(reminderType: string): boolean {
  if (typeof localStorage === 'undefined') return true;
  const today = new Date().toISOString().split('T')[0];
  return localStorage.getItem(`${SHOWN_KEY_PREFIX}${reminderType}`) === today;
}

export function markReminderShown(reminderType: string): void {
  if (typeof localStorage === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(`${SHOWN_KEY_PREFIX}${reminderType}`, today);
}

export function isTimeMatch(targetTime: string): boolean {
  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, '0');
  const currentMM = String(now.getMinutes()).padStart(2, '0');
  return `${currentHH}:${currentMM}` === targetTime;
}

export function isDayMatch(targetDay: string): boolean {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()] === targetDay.toLowerCase();
}
