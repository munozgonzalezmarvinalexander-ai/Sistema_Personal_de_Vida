import { describe, it, expect, vi } from 'vitest';
import { isTimeMatch, isDayMatch, wasReminderShownToday, markReminderShown, showLocalNotification } from '../api/notifications';
import { APP_TIME_ZONE } from '../utils/date';

describe('notifications utilities', () => {
  it('isTimeMatch returns false for non-matching time', () => {
    expect(isTimeMatch('99:99')).toBe(false);
  });

  it('isDayMatch works for known day', () => {
    const today = new Intl.DateTimeFormat('en-US', { timeZone: APP_TIME_ZONE, weekday: 'long' }).format(new Date()).toLowerCase();
    expect(isDayMatch(today)).toBe(true);
    expect(isDayMatch('nonexistent')).toBe(false);
  });

  it('wasReminderShownToday and markReminderShown work together', () => {
    expect(wasReminderShownToday('test-user', 'test_unique_key')).toBe(false);
    markReminderShown('test-user', 'test_unique_key');
    expect(wasReminderShownToday('test-user', 'test_unique_key')).toBe(true);
    expect(wasReminderShownToday('other-user', 'test_unique_key')).toBe(false);
  });

  it('rechecks the session after waiting for the service worker', async () => {
    let resolveRegistration!: (value: { showNotification: ReturnType<typeof vi.fn> }) => void;
    const showNotification = vi.fn();
    const registration = new Promise<{ showNotification: ReturnType<typeof vi.fn> }>((resolve) => { resolveRegistration = resolve; });
    const notification = vi.fn();
    Object.defineProperty(notification, 'permission', { value: 'granted' });
    vi.stubGlobal('Notification', notification);
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { getRegistration: () => registration } });
    let current = true;
    const result = showLocalNotification('Rumbo', 'Prueba', 'test', () => current);
    current = false;
    resolveRegistration({ showNotification });
    await expect(result).resolves.toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
    expect(notification).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
