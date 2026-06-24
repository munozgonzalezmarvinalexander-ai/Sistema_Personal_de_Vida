import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import type { Habit, HabitLog, DailyCheckin, LevelDone } from '../api/types';
import {
  Sun, Moon, Droplets, Brain, Zap, UtensilsCrossed,
  Smartphone, Wallet, BookOpen, Code, GraduationCap,
  Languages, Heart, Save, Star, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';

const LEVEL_LABELS: Record<LevelDone, string> = {
  none: 'No hecho',
  min: 'Minima',
  normal: 'Normal',
  ideal: 'Ideal',
};

const LEVEL_COLORS: Record<LevelDone, string> = {
  none: 'level-none',
  min: 'level-min',
  normal: 'level-normal',
  ideal: 'level-ideal',
};

const LEVEL_POINTS: Record<LevelDone, number> = {
  none: 0, min: 1, normal: 2, ideal: 3,
};

const todayStr = () => new Date().toISOString().split('T')[0];

function clampNum(val: string, min: number, max: number, step: number): string {
  if (val === '') return '';
  let n = Number(val);
  if (isNaN(n)) return '';
  n = Math.max(min, Math.min(max, n));
  if (step >= 1) n = Math.round(n);
  return String(n);
}

export default function Today() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [metrics, setMetrics] = useState({
    sleep_hours: '',
    sleep_quality: '',
    water_liters: '',
    mood: '',
    energy: '',
    food_quality: '',
    screen_hours: '',
    spending: '',
    university_study_minutes: '',
    english_minutes: '',
    programming_minutes: '',
    reading_minutes: '',
    meditation_minutes: '',
    note: '',
  });

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setPageLoading(true);
    setPageError('');
    try {
      const date = todayStr();
      const [habitsRes, logsRes, checkinRes] = await Promise.all([
        api.get('/habits', { params: { active_only: true } }),
        api.get('/habit-logs', { params: { log_date: date } }),
        api.get('/checkins/today'),
      ]);
      setHabits(habitsRes.data);
      const logsMap: Record<string, HabitLog> = {};
      for (const log of logsRes.data) {
        logsMap[log.habit_id] = log;
      }
      setLogs(logsMap);
      if (checkinRes.data) {
        setCheckin(checkinRes.data);
        setMetrics({
          sleep_hours: checkinRes.data.sleep_hours?.toString() ?? '',
          sleep_quality: checkinRes.data.sleep_quality?.toString() ?? '',
          water_liters: checkinRes.data.water_liters?.toString() ?? '',
          mood: checkinRes.data.mood?.toString() ?? '',
          energy: checkinRes.data.energy?.toString() ?? '',
          food_quality: checkinRes.data.food_quality?.toString() ?? '',
          screen_hours: checkinRes.data.screen_hours?.toString() ?? '',
          spending: checkinRes.data.spending?.toString() ?? '',
          university_study_minutes: checkinRes.data.university_study_minutes?.toString() ?? '',
          english_minutes: checkinRes.data.english_minutes?.toString() ?? '',
          programming_minutes: checkinRes.data.programming_minutes?.toString() ?? '',
          reading_minutes: checkinRes.data.reading_minutes?.toString() ?? '',
          meditation_minutes: checkinRes.data.meditation_minutes?.toString() ?? '',
          note: checkinRes.data.note ?? '',
        });
      }
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLevel = async (habitId: string, level: LevelDone) => {
    try {
      const existing = logs[habitId];
      if (existing) {
        const res = await api.put(`/habit-logs/${existing.id}`, { level_done: level });
        setLogs((prev) => ({ ...prev, [habitId]: res.data }));
      } else {
        const res = await api.post('/habit-logs', {
          habit_id: habitId,
          log_date: todayStr(),
          level_done: level,
        });
        setLogs((prev) => ({ ...prev, [habitId]: res.data }));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const validateMetrics = (): string | null => {
    const s = metrics;
    if (s.sleep_hours && (Number(s.sleep_hours) < 0 || Number(s.sleep_hours) > 24)) return 'Horas de sueno: 0-24';
    if (s.sleep_quality && (Number(s.sleep_quality) < 1 || Number(s.sleep_quality) > 5)) return 'Calidad sueno: 1-5';
    if (s.water_liters && (Number(s.water_liters) < 0 || Number(s.water_liters) > 15)) return 'Agua: 0-15 litros';
    if (s.mood && (Number(s.mood) < 1 || Number(s.mood) > 5)) return 'Animo: 1-5';
    if (s.energy && (Number(s.energy) < 1 || Number(s.energy) > 5)) return 'Energia: 1-5';
    if (s.food_quality && (Number(s.food_quality) < 1 || Number(s.food_quality) > 5)) return 'Comida: 1-5';
    if (s.screen_hours && (Number(s.screen_hours) < 0 || Number(s.screen_hours) > 24)) return 'Pantalla: 0-24 horas';
    if (s.spending && Number(s.spending) < 0) return 'Gasto no puede ser negativo';
    const minFields = ['university_study_minutes', 'english_minutes', 'programming_minutes', 'reading_minutes', 'meditation_minutes'] as const;
    for (const f of minFields) {
      if (s[f] && Number(s[f]) < 0) return 'Los minutos no pueden ser negativos';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateMetrics();
    if (validationError) {
      showToast('error', validationError);
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { checkin_date: todayStr() };
      const numFields = [
        'sleep_hours', 'sleep_quality', 'water_liters', 'mood', 'energy',
        'food_quality', 'screen_hours', 'spending', 'university_study_minutes',
        'english_minutes', 'programming_minutes', 'reading_minutes', 'meditation_minutes'
      ];
      for (const f of numFields) {
        const val = metrics[f as keyof typeof metrics];
        payload[f] = val !== '' ? Number(val) : null;
      }
      payload.note = metrics.note || null;

      if (checkin) {
        const { checkin_date: _, ...updatePayload } = payload;
        const res = await api.put(`/checkins/${checkin.id}`, updatePayload);
        setCheckin(res.data);
      } else {
        const res = await api.post('/checkins', payload);
        setCheckin(res.data);
      }
      showToast('success', 'Dia guardado correctamente');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = Object.values(logs).reduce((sum, l) => sum + l.points, 0);
  const completedCount = Object.values(logs).filter((l) => l.level_done !== 'none').length;

  const formatDate = () => {
    return new Date().toLocaleDateString('es-GT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (pageLoading) {
    return (
      <div className="today-page">
        <div className="loading-state"><Loader2 size={32} className="spin" /> Cargando tu dia...</div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="today-page">
        <div className="error-state">
          <AlertCircle size={32} />
          <p>{pageError}</p>
          <button className="btn btn-primary" onClick={loadData}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="today-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <header className="today-header">
        <div>
          <h1>{getGreeting()}, {user?.display_name?.split(' ')[0]}</h1>
          <p className="today-date">{formatDate()}</p>
        </div>
        <div className="points-badge">
          <Star size={20} />
          <span>{totalPoints} pts</span>
        </div>
      </header>

      <div className="today-summary">
        <div className="summary-item">
          <span className="summary-num">{completedCount}</span>
          <span className="summary-label">de {habits.length} habitos</span>
        </div>
        <div className="summary-item">
          <span className="summary-num">{totalPoints}</span>
          <span className="summary-label">puntos hoy</span>
        </div>
        <div className="summary-item">
          <span className="summary-num">{checkin ? 'Si' : 'No'}</span>
          <span className="summary-label">check-in</span>
        </div>
      </div>

      <section className="card habits-section">
        <h2>Habitos del dia</h2>
        <div className="habits-list">
          {habits.map((habit) => {
            const log = logs[habit.id];
            const currentLevel = (log?.level_done as LevelDone) || 'none';
            return (
              <div key={habit.id} className={`habit-card ${currentLevel !== 'none' ? 'habit-done' : ''}`}>
                <div className="habit-info">
                  <span className={`habit-name ${habit.is_core ? 'core' : ''}`}>
                    {habit.is_core && <Star size={14} />}
                    {habit.name}
                  </span>
                  <span className="habit-points">+{LEVEL_POINTS[currentLevel]}</span>
                </div>
                <div className="level-buttons">
                  {(['none', 'min', 'normal', 'ideal'] as LevelDone[]).map((level) => (
                    <button
                      key={level}
                      className={`level-btn ${LEVEL_COLORS[level]} ${currentLevel === level ? 'active' : ''}`}
                      onClick={() => handleLevel(habit.id, level)}
                      title={
                        level === 'min' ? habit.level_min :
                        level === 'normal' ? habit.level_normal :
                        level === 'ideal' ? habit.level_ideal : 'No hecho'
                      }
                    >
                      {LEVEL_LABELS[level]}
                    </button>
                  ))}
                </div>
                {currentLevel !== 'none' && (
                  <p className="level-desc">
                    {currentLevel === 'min' ? habit.level_min :
                     currentLevel === 'normal' ? habit.level_normal :
                     habit.level_ideal}
                  </p>
                )}
              </div>
            );
          })}
          {habits.length === 0 && (
            <p className="empty-state">No tienes habitos activos. Ve a Habitos para crear algunos.</p>
          )}
        </div>
      </section>

      <section className="card metrics-section">
        <h2>Metricas del dia</h2>

        <div className="metrics-group">
          <h3 className="metrics-group-title">Bienestar</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <label><Moon size={16} /> Horas de sueno</label>
              <input type="number" step="0.5" min="0" max="24" inputMode="decimal"
                value={metrics.sleep_hours}
                onChange={(e) => setMetrics({ ...metrics, sleep_hours: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, sleep_hours: clampNum(e.target.value, 0, 24, 0.5) })}
                placeholder="7.5"
              />
            </div>
            <div className="metric-item">
              <label><Sun size={16} /> Calidad sueno</label>
              <div className="rating-group">
                {[1,2,3,4,5].map((v) => (
                  <button key={v} type="button"
                    className={`rating-btn ${metrics.sleep_quality === String(v) ? 'active' : ''}`}
                    onClick={() => setMetrics({ ...metrics, sleep_quality: String(v) })}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div className="metric-item">
              <label><Droplets size={16} /> Agua (litros)</label>
              <input type="number" step="0.5" min="0" max="15" inputMode="decimal"
                value={metrics.water_liters}
                onChange={(e) => setMetrics({ ...metrics, water_liters: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, water_liters: clampNum(e.target.value, 0, 15, 0.5) })}
                placeholder="2.5"
              />
            </div>
            <div className="metric-item">
              <label><Heart size={16} /> Animo</label>
              <div className="rating-group">
                {[1,2,3,4,5].map((v) => (
                  <button key={v} type="button"
                    className={`rating-btn ${metrics.mood === String(v) ? 'active' : ''}`}
                    onClick={() => setMetrics({ ...metrics, mood: String(v) })}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div className="metric-item">
              <label><Zap size={16} /> Energia</label>
              <div className="rating-group">
                {[1,2,3,4,5].map((v) => (
                  <button key={v} type="button"
                    className={`rating-btn ${metrics.energy === String(v) ? 'active' : ''}`}
                    onClick={() => setMetrics({ ...metrics, energy: String(v) })}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div className="metric-item">
              <label><UtensilsCrossed size={16} /> Comida</label>
              <div className="rating-group">
                {[1,2,3,4,5].map((v) => (
                  <button key={v} type="button"
                    className={`rating-btn ${metrics.food_quality === String(v) ? 'active' : ''}`}
                    onClick={() => setMetrics({ ...metrics, food_quality: String(v) })}
                  >{v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="metrics-group">
          <h3 className="metrics-group-title">Tiempo invertido (minutos)</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <label><GraduationCap size={16} /> Estudio U</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.university_study_minutes}
                onChange={(e) => setMetrics({ ...metrics, university_study_minutes: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, university_study_minutes: clampNum(e.target.value, 0, 1440, 1) })}
                placeholder="45"
              />
            </div>
            <div className="metric-item">
              <label><Languages size={16} /> Ingles</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.english_minutes}
                onChange={(e) => setMetrics({ ...metrics, english_minutes: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, english_minutes: clampNum(e.target.value, 0, 1440, 1) })}
                placeholder="20"
              />
            </div>
            <div className="metric-item">
              <label><Code size={16} /> Programacion</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.programming_minutes}
                onChange={(e) => setMetrics({ ...metrics, programming_minutes: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, programming_minutes: clampNum(e.target.value, 0, 1440, 1) })}
                placeholder="30"
              />
            </div>
            <div className="metric-item">
              <label><BookOpen size={16} /> Lectura</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.reading_minutes}
                onChange={(e) => setMetrics({ ...metrics, reading_minutes: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, reading_minutes: clampNum(e.target.value, 0, 1440, 1) })}
                placeholder="15"
              />
            </div>
            <div className="metric-item">
              <label><Brain size={16} /> Meditacion</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.meditation_minutes}
                onChange={(e) => setMetrics({ ...metrics, meditation_minutes: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, meditation_minutes: clampNum(e.target.value, 0, 1440, 1) })}
                placeholder="5"
              />
            </div>
          </div>
        </div>

        <div className="metrics-group">
          <h3 className="metrics-group-title">Control</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <label><Smartphone size={16} /> Pantalla (horas)</label>
              <input type="number" step="0.5" min="0" max="24" inputMode="decimal"
                value={metrics.screen_hours}
                onChange={(e) => setMetrics({ ...metrics, screen_hours: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, screen_hours: clampNum(e.target.value, 0, 24, 0.5) })}
                placeholder="3"
              />
            </div>
            <div className="metric-item">
              <label><Wallet size={16} /> Gasto (Q)</label>
              <input type="number" min="0" step="0.01" inputMode="decimal"
                value={metrics.spending}
                onChange={(e) => setMetrics({ ...metrics, spending: e.target.value })}
                onBlur={(e) => setMetrics({ ...metrics, spending: clampNum(e.target.value, 0, 999999, 0.01) })}
                placeholder="50"
              />
            </div>
          </div>
        </div>

        <div className="metric-item note-item">
          <label>Nota personal</label>
          <textarea
            value={metrics.note}
            onChange={(e) => setMetrics({ ...metrics, note: e.target.value })}
            placeholder="Como fue tu dia?"
            rows={3}
          />
        </div>

        <button className="btn btn-primary btn-full save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={18} className="spin" /> Guardando...</> :
           <><Save size={18} /> Guardar dia</>}
        </button>
      </section>
    </div>
  );
}
