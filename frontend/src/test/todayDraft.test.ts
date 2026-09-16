import { describe, expect, it } from 'vitest';
import { parseTodayDraft, savedSnapshotIsCurrent, TODAY_METRIC_KEYS } from '../utils/todayDraft';

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
});
