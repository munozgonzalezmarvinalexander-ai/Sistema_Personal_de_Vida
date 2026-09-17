import { describe, expect, it } from 'vitest';
import { normalizeDecimal, parseTodayDraft, savedSnapshotIsCurrent, TODAY_METRIC_KEYS } from '../utils/todayDraft';

const valid = Object.fromEntries(TODAY_METRIC_KEYS.map((key) => [key, ''])) as Record<string, string>;

describe('today draft safety', () => {
  it('restores only complete string-valued drafts', () => {
    expect(parseTodayDraft(JSON.stringify({ ...valid, note: 'pendiente' }))?.note).toBe('pendiente');
    expect(parseTodayDraft('{broken')).toBeNull();
    expect(parseTodayDraft(JSON.stringify({ note: 'incompleto' }))).toBeNull();
    expect(parseTodayDraft(JSON.stringify({ ...valid, mood: 4 }))).toBeNull();
  });

  it('clears only the exact snapshot that was saved successfully', () => {
    expect(savedSnapshotIsCurrent(3, 3, '2026-09-16', '2026-09-16')).toBe(true);
    expect(savedSnapshotIsCurrent(3, 4, '2026-09-16', '2026-09-16')).toBe(false);
    expect(savedSnapshotIsCurrent(3, 3, '2026-09-16', '2026-09-17')).toBe(false);
  });

  it('normalizes decimals without turning an empty field into zero', () => {
    expect(normalizeDecimal('', 0, 24, 1)).toBe('');
    expect(normalizeDecimal('7.25', 0, 24, 1)).toBe('7.3');
    expect(normalizeDecimal('3.4000000000000004', 0, 15, 1)).toBe('3.4');
    expect(normalizeDecimal('12.345', 0, 999999.99, 2)).toBe('12.35');
    expect(normalizeDecimal('Infinity', 0, 24, 1)).toBe('');
  });
});
