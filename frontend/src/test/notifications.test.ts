import { describe, it, expect } from 'vitest';
import { isTimeMatch, isDayMatch, wasReminderShownToday, markReminderShown } from '../api/notifications';

describe('notifications utilities', () => {
  it('isTimeMatch returns false for non-matching time', () => {
    expect(isTimeMatch('99:99')).toBe(false);
  });

  it('isDayMatch works for known day', () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    expect(isDayMatch(today)).toBe(true);
    expect(isDayMatch('nonexistent')).toBe(false);
  });

  it('wasReminderShownToday and markReminderShown work together', () => {
    expect(wasReminderShownToday('test_unique_key')).toBe(false);
    markReminderShown('test_unique_key');
    expect(wasReminderShownToday('test_unique_key')).toBe(true);
  });
});
