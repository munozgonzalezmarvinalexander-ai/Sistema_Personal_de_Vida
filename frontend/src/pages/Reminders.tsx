import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import type { ReminderSettings } from '../api/types';
import {
  getNotificationPermission, requestNotificationPermission, showLocalNotification,
} from '../api/notifications';
import {
  Bell, Moon, Calendar, ListChecks, Loader2, AlertCircle,
  CheckCircle, BellOff, BellRing
} from 'lucide-react';

const DAYS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miercoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sabado' },
  { value: 'sunday', label: 'Domingo' },
];

export default function Reminders() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/reminders/settings')
      .then((res) => setSettings(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const save = async (updates: Partial<ReminderSettings>) => {
    if (!settings) return;
    try {
      const res = await api.put('/reminders/settings', updates);
      setSettings(res.data);
      showToast('success', 'Recordatorios guardados');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handlePermission = async () => {
    const result = await requestNotificationPermission();
    setNotifPerm(result);
    if (result === 'granted') {
      showLocalNotification('Rumbo', 'Notificaciones activadas. Te recordaremos registrar tu dia.');
      showToast('success', 'Notificaciones activadas');
    } else if (result === 'denied') {
      showToast('error', 'Permiso denegado. Puedes cambiarlo en la configuracion del navegador.');
    }
  };

  const handleTestNotif = () => {
    const sent = showLocalNotification('Rumbo', 'Es momento de registrar tu dia.');
    if (sent) {
      showToast('success', 'Notificacion de prueba enviada');
    } else {
      showToast('error', 'No se pudo enviar. Verifica permisos.');
    }
  };

  if (loading) {
    return <div className="reminders-page"><div className="loading-state"><Loader2 size={28} className="spin" /> Cargando recordatorios...</div></div>;
  }

  if (error || !settings) {
    return <div className="reminders-page"><div className="error-state"><AlertCircle size={28} /><p>{error || 'Error cargando configuracion'}</p></div></div>;
  }

  return (
    <div className="reminders-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <header className="page-header">
        <h1>Recordatorios</h1>
      </header>

      <div className="card reminder-intro">
        <Bell size={20} />
        <p>Recordatorios suaves para ayudarte a mantener tus habitos. Puedes activar o desactivar cada uno. Sin mensajes de culpa, solo apoyo.</p>
      </div>

      <div className="card reminder-item">
        <div className="reminder-header">
          <div className="reminder-icon"><Calendar size={20} /></div>
          <div className="reminder-info">
            <h3>Check-in diario</h3>
            <p>Recuerda registrar como fue tu dia.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.daily_checkin_enabled}
              onChange={(e) => save({ daily_checkin_enabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        {settings.daily_checkin_enabled && (
          <div className="reminder-config">
            <label>Hora</label>
            <input
              type="time"
              value={settings.daily_checkin_time}
              onChange={(e) => save({ daily_checkin_time: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="card reminder-item">
        <div className="reminder-header">
          <div className="reminder-icon"><Moon size={20} /></div>
          <div className="reminder-info">
            <h3>Cierre nocturno</h3>
            <p>Reduce pantallas y prepara el descanso.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.evening_shutdown_enabled}
              onChange={(e) => save({ evening_shutdown_enabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        {settings.evening_shutdown_enabled && (
          <div className="reminder-config">
            <label>Hora</label>
            <input
              type="time"
              value={settings.evening_shutdown_time}
              onChange={(e) => save({ evening_shutdown_time: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="card reminder-item">
        <div className="reminder-header">
          <div className="reminder-icon"><Calendar size={20} /></div>
          <div className="reminder-info">
            <h3>Revision semanal</h3>
            <p>Mira que funciono y que puedes ajustar.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.weekly_review_enabled}
              onChange={(e) => save({ weekly_review_enabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        {settings.weekly_review_enabled && (
          <div className="reminder-config">
            <div className="reminder-row">
              <div>
                <label>Dia</label>
                <select
                  value={settings.weekly_review_day}
                  onChange={(e) => save({ weekly_review_day: e.target.value })}
                >
                  {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label>Hora</label>
                <input
                  type="time"
                  value={settings.weekly_review_time}
                  onChange={(e) => save({ weekly_review_time: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card reminder-item">
        <div className="reminder-header">
          <div className="reminder-icon"><ListChecks size={20} /></div>
          <div className="reminder-info">
            <h3>Recordatorio de habitos</h3>
            <p>Un empujon suave si tienes habitos sin registrar.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.habit_nudge_enabled}
              onChange={(e) => save({ habit_nudge_enabled: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="card notif-section">
        <h3><BellRing size={18} /> Notificaciones del navegador</h3>
        <p className="notif-desc">
          Si activas las notificaciones, Rumbo puede mostrarte recordatorios aunque estes en otra pestana.
          Esto funciona mientras la app este abierta en el navegador.
        </p>
        {notifPerm === 'unsupported' && (
          <p className="notif-status">Tu navegador no soporta notificaciones.</p>
        )}
        {notifPerm === 'default' && (
          <button className="btn btn-primary" onClick={handlePermission}>
            <Bell size={16} /> Activar notificaciones
          </button>
        )}
        {notifPerm === 'granted' && (
          <div className="notif-granted">
            <p className="notif-status notif-ok"><CheckCircle size={14} /> Notificaciones activadas</p>
            <button className="btn btn-secondary btn-sm" onClick={handleTestNotif}>Enviar prueba</button>
          </div>
        )}
        {notifPerm === 'denied' && (
          <p className="notif-status notif-denied"><BellOff size={14} /> Permiso denegado. Cambialo en la configuracion del navegador.</p>
        )}
        <p className="notif-note">
          Estos recordatorios son locales. Si la app esta cerrada, puede que no se muestren hasta que se implemente un sistema de push completo.
        </p>
      </div>
    </div>
  );
}
