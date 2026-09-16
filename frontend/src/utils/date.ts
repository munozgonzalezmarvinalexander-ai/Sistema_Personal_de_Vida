export const APP_TIME_ZONE = 'America/Guatemala';

export function guatemalaDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function dateFromIso(value: string): Date {
  // Guatemala has a fixed UTC-06:00 offset. Anchoring at local noon keeps the
  // intended calendar day stable even when the device uses another time zone.
  return new Date(`${value}T12:00:00-06:00`);
}

export function addDays(value: string, days: number): string {
  const date = dateFromIso(value);
  date.setUTCDate(date.getUTCDate() + days);
  return guatemalaDateString(date);
}

export function mondayForGuatemala(date = new Date()): string {
  const today = guatemalaDateString(date);
  const local = dateFromIso(today);
  const day = local.getUTCDay();
  local.setUTCDate(local.getUTCDate() - day + (day === 0 ? -6 : 1));
  return guatemalaDateString(local);
}

export function formatGuatemalaDate(value: string, options: Intl.DateTimeFormatOptions): string {
  return dateFromIso(value).toLocaleDateString('es-GT', {
    ...options,
    timeZone: APP_TIME_ZONE,
  });
}
