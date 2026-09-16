import { useCallback, useEffect, useRef } from 'react';
import api from '../api/client';
import type { Habit, HabitLog, ReminderSettings } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { guatemalaDateString } from '../utils/date';
import {
  isTimeDue, isDayMatch, wasReminderShownToday,
  markReminderShown, showLocalNotification,
} from '../api/notifications';

export const REMINDER_SETTINGS_UPDATED_EVENT = 'rumbo:reminder-settings-updated';

const MESSAGES: Record<string, { title: string; body: string }> = {
  daily_checkin: { title: 'Rumbo', body: 'Es momento de registrar tu dia.' },
  evening_shutdown: { title: 'Rumbo', body: 'Hora de tu cierre nocturno. Reduce pantallas y prepara el descanso.' },
  weekly_review: { title: 'Rumbo', body: 'Hoy toca revision semanal. Mira que funciono esta semana.' },
  habit_nudge: { title: 'Rumbo', body: 'Aun tienes habitos pendientes. Una version minima tambien cuenta.' },
};

export default function ReminderChecker() {
  const { token, user } = useAuth();
  const checking = useRef(false);
  const generation = useRef(0);
  const settingsCache = useRef<{ userId: string; value: ReminderSettings; at: number } | null>(null);

  const deliver = useCallback(async (type: string, expectedGeneration: number) => {
    if (!user || wasReminderShownToday(user.id, type)) return;
    const message = MESSAGES[type];
    if (expectedGeneration !== generation.current || !token) return;
    if (await showLocalNotification(message.title, message.body, `rumbo-${type}`)
        && expectedGeneration === generation.current && token) {
      markReminderShown(user.id, type);
    }
  }, [token, user]);

  const check = useCallback(async () => {
    if (!token || !user || checking.current) return;
    checking.current = true;
    const expectedGeneration = generation.current;
    const controller = new AbortController();
    try {
      let settings = settingsCache.current?.userId === user.id && Date.now() - settingsCache.current.at < 300_000
        ? settingsCache.current.value : null;
      if (!settings) {
        const response = await api.get<ReminderSettings>('/reminders/settings', { signal: controller.signal });
        settings = response.data;
        settingsCache.current = { userId: user.id, value: settings, at: Date.now() };
      }
      if (expectedGeneration !== generation.current) return;
      if (settings.daily_checkin_enabled && isTimeDue(settings.daily_checkin_time)) {
        const { data: checkin } = await api.get('/checkins/today');
        if (!checkin) await deliver('daily_checkin', expectedGeneration);
      }
      if (settings.evening_shutdown_enabled && isTimeDue(settings.evening_shutdown_time)) {
        await deliver('evening_shutdown', expectedGeneration);
      }
      if (settings.weekly_review_enabled && isDayMatch(settings.weekly_review_day) && isTimeDue(settings.weekly_review_time)) {
        await deliver('weekly_review', expectedGeneration);
      }
      if (settings.habit_nudge_enabled && isTimeDue(settings.daily_checkin_time, 120)) {
        const date = guatemalaDateString();
        const [{ data: habits }, { data: logs }] = await Promise.all([
          api.get<Habit[]>('/habits', { params: { active_only: true } }),
          api.get<HabitLog[]>('/habit-logs', { params: { log_date: date } }),
        ]);
        const completed = new Set(logs.filter((log) => log.completed).map((log) => log.habit_id));
        if (habits.some((habit) => !completed.has(habit.id))) await deliver('habit_nudge', expectedGeneration);
      }
    } catch {
      // Connectivity failures are retried on the next timer/focus/online event.
    } finally {
      checking.current = false;
    }
  }, [deliver, token, user]);

  useEffect(() => {
    generation.current += 1;
    if (!token || !user) return;
    void check();
    const interval = window.setInterval(check, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    const onSettingsUpdated = () => { settingsCache.current = null; void check(); };
    window.addEventListener(REMINDER_SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      generation.current += 1;
      checking.current = false;
      window.removeEventListener(REMINDER_SETTINGS_UPDATED_EVENT, onSettingsUpdated);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check, token, user]);

  return null;
}
