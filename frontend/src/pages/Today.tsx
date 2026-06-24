import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import type { Habit, HabitLog, DailyCheckin, LevelDone } from '../api/types';
import {
  Sun, Moon, Droplets, Brain, Zap, UtensilsCrossed,
  Smartphone, Wallet, BookOpen, Code, GraduationCap,
  Languages, Heart, Save, Star
} from 'lucide-react';

const LEVEL_LABELS: Record<LevelDone, string> = {
  none: 'No hecho',
  min: 'Mínima',
  normal: 'Normal',
  ideal: 'Ideal',
};

const LEVEL_COLORS: Record<LevelDone, string> = {
  none: 'level-none',
  min: 'level-min',
  normal: 'level-normal',
  ideal: 'level-ideal',
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function Today() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLevel = async (habitId: string, level: LevelDone) => {
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
  };

  const handleSave = async () => {
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
        const res = await api.put(`/checkins/${checkin.id}`, payload);
        setCheckin(res.data);
      } else {
        const res = await api.post('/checkins', payload);
        setCheckin(res.data);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = Object.values(logs).reduce((sum, l) => sum + l.points, 0);

  const formatDate = () => {
    return new Date().toLocaleDateString('es-GT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="today-page">
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

      <section className="card habits-section">
        <h2>Hábitos del día</h2>
        <div className="habits-list">
          {habits.map((habit) => {
            const log = logs[habit.id];
            const currentLevel = (log?.level_done as LevelDone) || 'none';
            return (
              <div key={habit.id} className="habit-card">
                <div className="habit-info">
                  <span className={`habit-name ${habit.is_core ? 'core' : ''}`}>
                    {habit.is_core && <Star size={14} />}
                    {habit.name}
                  </span>
                  <span className="habit-category">{habit.category}</span>
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
            <p className="empty-state">No tienes hábitos activos. Ve a la sección de Hábitos para crear algunos.</p>
          )}
        </div>
      </section>

      <section className="card metrics-section">
        <h2>Métricas del día</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <label><Moon size={16} /> Horas de sueño</label>
            <input type="number" step="0.5" min="0" max="24"
              value={metrics.sleep_hours}
              onChange={(e) => setMetrics({ ...metrics, sleep_hours: e.target.value })}
              placeholder="7.5"
            />
          </div>
          <div className="metric-item">
            <label><Sun size={16} /> Calidad sueño (1-5)</label>
            <div className="rating-group">
              {[1,2,3,4,5].map((v) => (
                <button key={v}
                  className={`rating-btn ${metrics.sleep_quality === String(v) ? 'active' : ''}`}
                  onClick={() => setMetrics({ ...metrics, sleep_quality: String(v) })}
                >{v}</button>
              ))}
            </div>
          </div>
          <div className="metric-item">
            <label><Droplets size={16} /> Agua (litros)</label>
            <input type="number" step="0.5" min="0" max="15"
              value={metrics.water_liters}
              onChange={(e) => setMetrics({ ...metrics, water_liters: e.target.value })}
              placeholder="2.5"
            />
          </div>
          <div className="metric-item">
            <label><Heart size={16} /> Ánimo (1-5)</label>
            <div className="rating-group">
              {[1,2,3,4,5].map((v) => (
                <button key={v}
                  className={`rating-btn ${metrics.mood === String(v) ? 'active' : ''}`}
                  onClick={() => setMetrics({ ...metrics, mood: String(v) })}
                >{v}</button>
              ))}
            </div>
          </div>
          <div className="metric-item">
            <label><Zap size={16} /> Energía (1-5)</label>
            <div className="rating-group">
              {[1,2,3,4,5].map((v) => (
                <button key={v}
                  className={`rating-btn ${metrics.energy === String(v) ? 'active' : ''}`}
                  onClick={() => setMetrics({ ...metrics, energy: String(v) })}
                >{v}</button>
              ))}
            </div>
          </div>
          <div className="metric-item">
            <label><UtensilsCrossed size={16} /> Comida (1-5)</label>
            <div className="rating-group">
              {[1,2,3,4,5].map((v) => (
                <button key={v}
                  className={`rating-btn ${metrics.food_quality === String(v) ? 'active' : ''}`}
                  onClick={() => setMetrics({ ...metrics, food_quality: String(v) })}
                >{v}</button>
              ))}
            </div>
          </div>
          <div className="metric-item">
            <label><GraduationCap size={16} /> Estudio U (min)</label>
            <input type="number" min="0"
              value={metrics.university_study_minutes}
              onChange={(e) => setMetrics({ ...metrics, university_study_minutes: e.target.value })}
              placeholder="45"
            />
          </div>
          <div className="metric-item">
            <label><Languages size={16} /> Inglés (min)</label>
            <input type="number" min="0"
              value={metrics.english_minutes}
              onChange={(e) => setMetrics({ ...metrics, english_minutes: e.target.value })}
              placeholder="20"
            />
          </div>
          <div className="metric-item">
            <label><Code size={16} /> Programación (min)</label>
            <input type="number" min="0"
              value={metrics.programming_minutes}
              onChange={(e) => setMetrics({ ...metrics, programming_minutes: e.target.value })}
              placeholder="30"
            />
          </div>
          <div className="metric-item">
            <label><BookOpen size={16} /> Lectura (min)</label>
            <input type="number" min="0"
              value={metrics.reading_minutes}
              onChange={(e) => setMetrics({ ...metrics, reading_minutes: e.target.value })}
              placeholder="15"
            />
          </div>
          <div className="metric-item">
            <label><Brain size={16} /> Meditación (min)</label>
            <input type="number" min="0"
              value={metrics.meditation_minutes}
              onChange={(e) => setMetrics({ ...metrics, meditation_minutes: e.target.value })}
              placeholder="5"
            />
          </div>
          <div className="metric-item">
            <label><Smartphone size={16} /> Pantalla (horas)</label>
            <input type="number" step="0.5" min="0" max="24"
              value={metrics.screen_hours}
              onChange={(e) => setMetrics({ ...metrics, screen_hours: e.target.value })}
              placeholder="3"
            />
          </div>
          <div className="metric-item">
            <label><Wallet size={16} /> Gasto (Q)</label>
            <input type="number" min="0"
              value={metrics.spending}
              onChange={(e) => setMetrics({ ...metrics, spending: e.target.value })}
              placeholder="50"
            />
          </div>
        </div>
        <div className="metric-item note-item">
          <label>Nota personal</label>
          <textarea
            value={metrics.note}
            onChange={(e) => setMetrics({ ...metrics, note: e.target.value })}
            placeholder="¿Cómo fue tu día?"
            rows={3}
          />
        </div>
        <button className="btn btn-primary btn-full save-btn" onClick={handleSave} disabled={saving}>
          <Save size={18} />
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar día'}
        </button>
      </section>
    </div>
  );
}
