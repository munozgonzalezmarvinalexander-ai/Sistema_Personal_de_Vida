import { describe, it, expect } from 'vitest';
import { isTimeMatch, isDayMatch, wasReminderShownToday, markReminderShown } from '../api/notifications';
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
});
