export const TODAY_METRIC_KEYS = [
  'sleep_hours', 'sleep_quality', 'water_liters', 'mood', 'energy',
  'food_quality', 'screen_hours', 'spending', 'university_study_minutes',
  'english_minutes', 'programming_minutes', 'reading_minutes',
  'meditation_minutes', 'note',
] as const;

export type TodayMetrics = Record<(typeof TODAY_METRIC_KEYS)[number], string>;

export function normalizeDecimal(value: string, min: number, max: number, decimals: number): string {
  if (value.trim() === '') return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  const factor = 10 ** decimals;
  const bounded = Math.max(min, Math.min(max, parsed));
  const rounded = Math.round((bounded + Number.EPSILON) * factor) / factor;
  return rounded.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9]*?)0+$/g, '');
}

export function parseTodayDraft(raw: string): TodayMetrics | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (!TODAY_METRIC_KEYS.every((key) => typeof record[key] === 'string')) return null;
    return Object.fromEntries(TODAY_METRIC_KEYS.map((key) => [key, record[key]])) as TodayMetrics;
  } catch {
    return null;
  }
}

export function clearUserDrafts(userId: string): boolean {
  try {
    const prefix = `rumbo_checkin_draft_${userId}_`;
    Object.keys(localStorage).filter((key) => key.startsWith(prefix)).forEach((key) => localStorage.removeItem(key));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function savedSnapshotIsCurrent(savedRevision: number, currentRevision: number, savedDate: string, currentDate: string): boolean {
  return savedRevision === currentRevision && savedDate === currentDate;
}
