import { useEffect, useRef } from 'react';
import api from '../api/client';
import type { ReminderSettings } from '../api/types';
import {
  isTimeMatch, isDayMatch, wasReminderShownToday,
  markReminderShown, showLocalNotification,
} from '../api/notifications';

const MESSAGES: Record<string, { title: string; body: string }> = {
  daily_checkin: {
    title: 'Rumbo',
    body: 'Es momento de registrar tu dia.',
  },
  evening_shutdown: {
    title: 'Rumbo',
    body: 'Hora de tu cierre nocturno. Reduce pantallas y prepara el descanso.',
  },
  weekly_review: {
    title: 'Rumbo',
    body: 'Hoy toca revision semanal. Mira que funciono esta semana.',
  },
};

export default function ReminderChecker() {
  const settingsRef = useRef<ReminderSettings | null>(null);

  useEffect(() => {
    api.get('/reminders/settings')
      .then((res) => { settingsRef.current = res.data; })
      .catch(() => {});

    const interval = setInterval(() => {
      const s = settingsRef.current;
      if (!s) return;

      if (s.daily_checkin_enabled && isTimeMatch(s.daily_checkin_time)) {
        if (!wasReminderShownToday('daily_checkin')) {
          markReminderShown('daily_checkin');
          showLocalNotification(MESSAGES.daily_checkin.title, MESSAGES.daily_checkin.body);
        }
      }

      if (s.evening_shutdown_enabled && isTimeMatch(s.evening_shutdown_time)) {
        if (!wasReminderShownToday('evening_shutdown')) {
          markReminderShown('evening_shutdown');
          showLocalNotification(MESSAGES.evening_shutdown.title, MESSAGES.evening_shutdown.body);
        }
      }

      if (s.weekly_review_enabled && isDayMatch(s.weekly_review_day) && isTimeMatch(s.weekly_review_time)) {
        if (!wasReminderShownToday('weekly_review')) {
          markReminderShown('weekly_review');
          showLocalNotification(MESSAGES.weekly_review.title, MESSAGES.weekly_review.body);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
