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

  const deliver = useCallback(async (type: string) => {
    if (!user || wasReminderShownToday(user.id, type)) return;
    const message = MESSAGES[type];
    if (await showLocalNotification(message.title, message.body, `rumbo-${type}`)) {
      markReminderShown(user.id, type);
    }
  }, [user]);

  const check = useCallback(async () => {
    if (!token || !user || checking.current) return;
    checking.current = true;
    try {
      const { data: settings } = await api.get<ReminderSettings>('/reminders/settings');
      if (settings.daily_checkin_enabled && isTimeDue(settings.daily_checkin_time)) {
        const { data: checkin } = await api.get('/checkins/today');
        if (!checkin) await deliver('daily_checkin');
      }
      if (settings.evening_shutdown_enabled && isTimeDue(settings.evening_shutdown_time)) {
        await deliver('evening_shutdown');
      }
      if (settings.weekly_review_enabled && isDayMatch(settings.weekly_review_day) && isTimeDue(settings.weekly_review_time)) {
        await deliver('weekly_review');
      }
      if (settings.habit_nudge_enabled && isTimeDue(settings.daily_checkin_time, 120)) {
        const date = guatemalaDateString();
        const [{ data: habits }, { data: logs }] = await Promise.all([
          api.get<Habit[]>('/habits', { params: { active_only: true } }),
          api.get<HabitLog[]>('/habit-logs', { params: { log_date: date } }),
        ]);
        const completed = new Set(logs.filter((log) => log.completed).map((log) => log.habit_id));
        if (habits.some((habit) => !completed.has(habit.id))) await deliver('habit_nudge');
      }
    } catch {
      // Connectivity failures are retried on the next timer/focus/online event.
    } finally {
      checking.current = false;
    }
  }, [deliver, token, user]);

  useEffect(() => {
    if (!token || !user) return;
    void check();
    const interval = window.setInterval(check, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    window.addEventListener(REMINDER_SETTINGS_UPDATED_EVENT, onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      window.removeEventListener(REMINDER_SETTINGS_UPDATED_EVENT, onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [check, token, user]);

  return null;
}
