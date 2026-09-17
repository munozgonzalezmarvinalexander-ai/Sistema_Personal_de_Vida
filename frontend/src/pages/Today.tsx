import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../api/client';
import type { Habit, HabitLog, DailyCheckin, LevelDone, StreakResponse, UserProgress, RecalculateResult, Insight } from '../api/types';
import { APP_TIME_ZONE, formatGuatemalaDate, guatemalaDateString } from '../utils/date';
import { clearDraft, clearUserDrafts, normalizeDecimal, parseTodayDraft, savedSnapshotIsCurrent, type TodayMetrics } from '../utils/todayDraft';
import { setUnsavedChanges } from '../utils/dirtyState';
import {
  Sun, Moon, Droplets, Brain, Zap, UtensilsCrossed,
  Smartphone, Wallet, BookOpen, Code, GraduationCap,
  Languages, Heart, Save, Star, AlertCircle, CheckCircle, Loader2, Flame, Award, Lightbulb
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

const EMPTY_METRICS = {
  sleep_hours: '', sleep_quality: '', water_liters: '', mood: '', energy: '',
  food_quality: '', screen_hours: '', spending: '', university_study_minutes: '',
  english_minutes: '', programming_minutes: '', reading_minutes: '',
  meditation_minutes: '', note: '',
};

type Metrics = TodayMetrics;

function checkinMetrics(checkin: DailyCheckin | null): Metrics {
  if (!checkin) return { ...EMPTY_METRICS };
  return {
    sleep_hours: checkin.sleep_hours?.toString() ?? '', sleep_quality: checkin.sleep_quality?.toString() ?? '',
    water_liters: checkin.water_liters?.toString() ?? '', mood: checkin.mood?.toString() ?? '',
    energy: checkin.energy?.toString() ?? '', food_quality: checkin.food_quality?.toString() ?? '',
    screen_hours: checkin.screen_hours?.toString() ?? '', spending: checkin.spending?.toString() ?? '',
    university_study_minutes: checkin.university_study_minutes?.toString() ?? '',
    english_minutes: checkin.english_minutes?.toString() ?? '', programming_minutes: checkin.programming_minutes?.toString() ?? '',
    reading_minutes: checkin.reading_minutes?.toString() ?? '', meditation_minutes: checkin.meditation_minutes?.toString() ?? '',
    note: checkin.note ?? '',
  };
}

export default function Today() {
  const { user } = useAuth();
  const [activeDate, setActiveDate] = useState(guatemalaDateString);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [topInsight, setTopInsight] = useState<Insight | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [optionalError, setOptionalError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [dayChanged, setDayChanged] = useState(false);
  const [draftStorageError, setDraftStorageError] = useState(false);
  const [pendingHabits, setPendingHabits] = useState<Set<string>>(new Set());
  const requestSequence = useRef(0);
  const editRevision = useRef(0);
  const savingRef = useRef(false);
  const pendingHabitRef = useRef(new Set<string>());

  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [confirmedMetrics, setConfirmedMetrics] = useState<Metrics>(EMPTY_METRICS);
  const activeDateRef = useRef(activeDate);
  activeDateRef.current = activeDate;

  const draftKey = user ? `rumbo_checkin_draft_${user.id}_${activeDate}` : '';
  const updateMetrics = (updates: Partial<Metrics>) => {
    editRevision.current += 1;
    setMetrics((current) => ({ ...current, ...updates }));
    setDirty(true);
  };

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOptionalData = useCallback(async (sequence: number) => {
    setOptionalError('');
    const results = await Promise.allSettled([
      api.get('/reports/streaks'),
      api.get('/gamification/progress'),
      api.get('/insights'),
    ]);
    if (sequence !== requestSequence.current) return;
    if (results[0].status === 'fulfilled') setStreak(results[0].value.data);
    if (results[1].status === 'fulfilled') setProgress(results[1].value.data);
    if (results[2].status === 'fulfilled') {
      const insights = results[2].value.data as Insight[];
      setTopInsight(insights.find((i) => i.priority === 'high') || insights.find((i) => i.priority === 'medium') || insights[0] || null);
    }
    if (results.some((result) => result.status === 'rejected')) {
      setOptionalError('Algunos resúmenes no se pudieron actualizar. Tus datos del día siguen disponibles.');
    }
  }, []);

  const loadData = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setPageLoading(true);
    setPageError('');
    try {
      const [habitsRes, logsRes, checkinRes] = await Promise.all([
        api.get('/habits', { params: { active_only: true } }),
        api.get('/habit-logs', { params: { log_date: activeDate } }),
        api.get('/checkins/today', { params: { checkin_date: activeDate } }),
      ]);
      if (sequence !== requestSequence.current) return;
      setHabits(habitsRes.data);
      const logsMap: Record<string, HabitLog> = {};
      for (const log of logsRes.data) {
        logsMap[log.habit_id] = log;
      }
      setLogs(logsMap);
      setCheckin(checkinRes.data || null);
      let loadedMetrics = checkinMetrics(checkinRes.data || null);
      setConfirmedMetrics(loadedMetrics);
      let savedDraft: string | null = null;
      try { savedDraft = draftKey ? localStorage.getItem(draftKey) : null; }
      catch { setDraftStorageError(true); }
      if (savedDraft) {
        const parsed = parseTodayDraft(savedDraft);
        if (parsed) { loadedMetrics = parsed; setDirty(true); }
        else {
          try { localStorage.removeItem(draftKey); } catch { setDraftStorageError(true); }
          setDirty(false);
        }
      } else setDirty(false);
      setMetrics(loadedMetrics);
      void loadOptionalData(sequence);
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setPageLoading(false);
    }
  }, [activeDate, draftKey, loadOptionalData]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!dirty || !draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(metrics));
      setDraftStorageError(false);
    } catch { setDraftStorageError(true); }
  }, [dirty, draftKey, metrics]);

  useEffect(() => {
    setUnsavedChanges(dirty || saving || pendingHabits.size > 0);
    return () => setUnsavedChanges(false);
  }, [dirty, saving, pendingHabits]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const checkDate = () => setDayChanged(guatemalaDateString() !== activeDate);
    checkDate();
    const interval = window.setInterval(checkDate, 60_000);
    return () => window.clearInterval(interval);
  }, [activeDate]);

  const handleLevel = async (habitId: string, level: LevelDone) => {
    if (pendingHabitRef.current.has(habitId)) return;
    pendingHabitRef.current.add(habitId);
    setPendingHabits(new Set(pendingHabitRef.current));
    try {
      const existing = logs[habitId];
      if (existing) {
        const res = await api.put(`/habit-logs/${existing.id}`, { level_done: level });
        setLogs((prev) => ({ ...prev, [habitId]: res.data }));
      } else {
        const res = await api.post('/habit-logs', {
          habit_id: habitId,
          log_date: activeDate,
          level_done: level,
        });
        setLogs((prev) => ({ ...prev, [habitId]: res.data }));
      }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      pendingHabitRef.current.delete(habitId);
      setPendingHabits(new Set(pendingHabitRef.current));
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
    for (const value of Object.values(s).slice(0, -1)) {
      if (value && !Number.isFinite(Number(value))) return 'Hay un valor numerico no valido';
    }
    if (s.spending && (Number(s.spending) < 0 || Number(s.spending) > 999999.99)) return 'Gasto: 0-999999.99';
    const minFields = ['university_study_minutes', 'english_minutes', 'programming_minutes', 'reading_minutes', 'meditation_minutes'] as const;
    for (const f of minFields) {
      if (s[f] && Number(s[f]) < 0) return 'Los minutos no pueden ser negativos';
    }
    return null;
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    const validationError = validateMetrics();
    if (validationError) {
      showToast('error', validationError);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    const savedRevision = editRevision.current;
    const snapshot = {
      ...metrics,
      sleep_hours: normalizeDecimal(metrics.sleep_hours, 0, 24, 1),
      water_liters: normalizeDecimal(metrics.water_liters, 0, 15, 1),
      screen_hours: normalizeDecimal(metrics.screen_hours, 0, 24, 1),
      spending: normalizeDecimal(metrics.spending, 0, 999999.99, 2),
    };
    const savedDate = activeDate;
    try {
      const payload: Record<string, unknown> = { checkin_date: activeDate };
      const numFields = [
        'sleep_hours', 'sleep_quality', 'water_liters', 'mood', 'energy',
        'food_quality', 'screen_hours', 'spending', 'university_study_minutes',
        'english_minutes', 'programming_minutes', 'reading_minutes', 'meditation_minutes'
      ];
      for (const f of numFields) {
        const val = snapshot[f as keyof typeof snapshot];
        payload[f] = val !== '' ? Number(val) : null;
      }
      payload.note = snapshot.note || null;

      if (checkin) {
        const { checkin_date: _, ...updatePayload } = payload;
        const res = await api.put(`/checkins/${checkin.id}`, updatePayload);
        if (activeDateRef.current === savedDate) {
          setCheckin(res.data);
          setConfirmedMetrics(checkinMetrics(res.data));
        }
      } else {
        const res = await api.post('/checkins', payload);
        if (activeDateRef.current === savedDate) {
          setCheckin(res.data);
          setConfirmedMetrics(checkinMetrics(res.data));
        }
      }
      if (savedSnapshotIsCurrent(savedRevision, editRevision.current, savedDate, activeDateRef.current)) {
        try { localStorage.removeItem(draftKey); } catch { setDraftStorageError(true); }
        setDirty(false);
      }
      showToast('success', 'Dia guardado correctamente');
      try {
        const recalc = await api.post<RecalculateResult>('/gamification/recalculate');
        if (recalc.data.new_achievements.length > 0) {
          setTimeout(() => showToast('success', 'Logro desbloqueado!'), 1500);
        }
        const progRes = await api.get('/gamification/progress');
        setProgress(progRes.data);
      } catch { /* ignore gamification errors */ }
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const discardCurrentDraft = () => {
    if (!clearDraft(draftKey)) {
      setDraftStorageError(true);
      showToast('error', 'No se pudo descartar el borrador local');
      return;
    }
    editRevision.current += 1;
    setMetrics({ ...confirmedMetrics });
    setDirty(false);
    setDraftStorageError(false);
    showToast('success', 'Borrador descartado; restauramos los ultimos datos guardados');
  };

  const discardAllLocalDrafts = () => {
    if (!user) return;
    if (!clearUserDrafts(user.id)) {
      setDraftStorageError(true);
      showToast('error', 'No se pudo limpiar el almacenamiento del navegador');
      return;
    }
    editRevision.current += 1;
    setMetrics({ ...confirmedMetrics });
    setDirty(false);
    setDraftStorageError(false);
    showToast('success', 'Borradores locales eliminados; los datos guardados no cambiaron');
  };

  const totalPoints = Object.values(logs).reduce((sum, l) => sum + l.points, 0);
  const completedCount = Object.values(logs).filter((l) => l.level_done !== 'none').length;

  const formatDate = () => {
    return formatGuatemalaDate(activeDate, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getGreeting = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: APP_TIME_ZONE, hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const h = Number(parts.find((part) => part.type === 'hour')?.value || 0);
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

      {dayChanged && (
        <div className="card checkin-reminder day-rollover-warning">
          <AlertCircle size={18} />
          <p>Empezó un nuevo día. Este formulario sigue guardando el {activeDate} para no mezclar registros.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            if (savingRef.current || pendingHabitRef.current.size > 0) { showToast('error', 'Espera a que terminen los guardados pendientes.'); return; }
            if (dirty) { showToast('error', 'Guarda o descarta este borrador antes de cambiar de día.'); return; }
            setActiveDate(guatemalaDateString());
            setDayChanged(false);
          }}>Ir al día actual</button>
        </div>
      )}

      <header className="today-header">
        <div>
          <h1>{getGreeting()}, {user?.display_name?.split(' ')[0]}</h1>
          <p className="today-date">{formatDate()}</p>
        </div>
        <div className="header-badges">
          <div className="points-badge">
            <Star size={20} />
            <span>{totalPoints} pts</span>
          </div>
          {streak && streak.current_streak > 0 && (
            <div className="streak-badge">
              <Flame size={18} />
              <span>{streak.current_streak}</span>
            </div>
          )}
          {progress && (
            <div className="level-badge-small">
              <Award size={16} />
              <span>Nv.{progress.level}</span>
            </div>
          )}
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

      {!checkin && (
        <div className="card checkin-reminder">
          <CheckCircle size={18} />
          <p>Todavia no registraste tu dia. Puedes hacerlo en menos de 1 minuto.</p>
        </div>
      )}
      {checkin && (
        <div className="card checkin-done">
          <CheckCircle size={18} />
          <p>Check-in completado hoy.</p>
        </div>
      )}

      {topInsight && (
        <div className="card today-insight">
          <Lightbulb size={16} />
          <p><strong>{topInsight.title}:</strong> {topInsight.recommendation}</p>
        </div>
      )}
      {optionalError && (
        <div className="error-msg"><AlertCircle size={16} /> {optionalError} <button className="btn btn-secondary btn-sm" onClick={() => void loadOptionalData(requestSequence.current)}>Reintentar resúmenes</button></div>
      )}

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
                      disabled={pendingHabits.has(habit.id)}
                      aria-busy={pendingHabits.has(habit.id)}
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
              <input type="number" step="0.1" min="0" max="24" inputMode="decimal"
                value={metrics.sleep_hours}
                onChange={(e) => updateMetrics({ sleep_hours: e.target.value })}
                onBlur={(e) => updateMetrics({ sleep_hours: normalizeDecimal(e.target.value, 0, 24, 1) })}
                placeholder="7.5"
              />
            </div>
            <div className="metric-item">
              <label><Sun size={16} /> Calidad sueno</label>
              <div className="rating-group">
                {[1,2,3,4,5].map((v) => (
                  <button key={v} type="button"
                    className={`rating-btn ${metrics.sleep_quality === String(v) ? 'active' : ''}`}
                    onClick={() => updateMetrics({ sleep_quality: String(v) })}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div className="metric-item">
              <label><Droplets size={16} /> Agua (litros)</label>
              <input type="number" step="0.1" min="0" max="15" inputMode="decimal"
                value={metrics.water_liters}
                onChange={(e) => updateMetrics({ water_liters: e.target.value })}
                onBlur={(e) => updateMetrics({ water_liters: normalizeDecimal(e.target.value, 0, 15, 1) })}
                placeholder="2.5"
              />
            </div>
            <div className="metric-item">
              <label><Heart size={16} /> Animo</label>
              <div className="rating-group">
                {[1,2,3,4,5].map((v) => (
                  <button key={v} type="button"
                    className={`rating-btn ${metrics.mood === String(v) ? 'active' : ''}`}
                    onClick={() => updateMetrics({ mood: String(v) })}
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
                    onClick={() => updateMetrics({ energy: String(v) })}
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
                    onClick={() => updateMetrics({ food_quality: String(v) })}
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
                onChange={(e) => updateMetrics({ university_study_minutes: e.target.value })}
                onBlur={(e) => updateMetrics({ university_study_minutes: normalizeDecimal(e.target.value, 0, 1440, 0) })}
                placeholder="45"
              />
            </div>
            <div className="metric-item">
              <label><Languages size={16} /> Ingles</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.english_minutes}
                onChange={(e) => updateMetrics({ english_minutes: e.target.value })}
                onBlur={(e) => updateMetrics({ english_minutes: normalizeDecimal(e.target.value, 0, 1440, 0) })}
                placeholder="20"
              />
            </div>
            <div className="metric-item">
              <label><Code size={16} /> Programacion</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.programming_minutes}
                onChange={(e) => updateMetrics({ programming_minutes: e.target.value })}
                onBlur={(e) => updateMetrics({ programming_minutes: normalizeDecimal(e.target.value, 0, 1440, 0) })}
                placeholder="30"
              />
            </div>
            <div className="metric-item">
              <label><BookOpen size={16} /> Lectura</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.reading_minutes}
                onChange={(e) => updateMetrics({ reading_minutes: e.target.value })}
                onBlur={(e) => updateMetrics({ reading_minutes: normalizeDecimal(e.target.value, 0, 1440, 0) })}
                placeholder="15"
              />
            </div>
            <div className="metric-item">
              <label><Brain size={16} /> Meditacion</label>
              <input type="number" min="0" inputMode="numeric"
                value={metrics.meditation_minutes}
                onChange={(e) => updateMetrics({ meditation_minutes: e.target.value })}
                onBlur={(e) => updateMetrics({ meditation_minutes: normalizeDecimal(e.target.value, 0, 1440, 0) })}
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
              <input type="number" step="0.1" min="0" max="24" inputMode="decimal"
                value={metrics.screen_hours}
                onChange={(e) => updateMetrics({ screen_hours: e.target.value })}
                onBlur={(e) => updateMetrics({ screen_hours: normalizeDecimal(e.target.value, 0, 24, 1) })}
                placeholder="3"
              />
            </div>
            <div className="metric-item">
              <label><Wallet size={16} /> Gasto (Q)</label>
              <input type="number" min="0" max="999999.99" step="0.01" inputMode="decimal"
                value={metrics.spending}
                onChange={(e) => updateMetrics({ spending: e.target.value })}
                onBlur={(e) => updateMetrics({ spending: normalizeDecimal(e.target.value, 0, 999999.99, 2) })}
                placeholder="50"
              />
            </div>
          </div>
        </div>

        <div className="metric-item note-item">
          <label>Nota personal</label>
          <textarea
            value={metrics.note}
            onChange={(e) => updateMetrics({ note: e.target.value })}
            placeholder="Como fue tu dia?"
            rows={3}
          />
        </div>

        <button className="btn btn-primary btn-full save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={18} className="spin" /> Guardando...</> :
           <><Save size={18} /> Guardar dia</>}
        </button>
        {draftStorageError && <p className="error-msg">Los cambios siguen en esta pestaña, pero el navegador no pudo proteger este borrador local.</p>}
        {dirty && <button type="button" className="btn btn-secondary btn-full" onClick={discardCurrentDraft} disabled={saving}>Descartar borrador de este dia</button>}
        <button type="button" className="btn btn-secondary btn-full" onClick={discardAllLocalDrafts} disabled={saving}>Eliminar todos mis borradores locales</button>
      </section>
    </div>
  );
}
