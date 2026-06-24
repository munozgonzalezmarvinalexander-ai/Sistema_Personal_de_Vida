import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import type { WeeklyReport as WeeklyReportType, StreakResponse, ComparisonValue } from '../api/types';
import {
  ChevronLeft, ChevronRight, Moon, Heart, Zap, GraduationCap,
  Languages, Code, BookOpen, Brain, Trophy, Star, TrendingUp,
  TrendingDown, AlertCircle, Loader2, Lightbulb, Flame,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';

function getMonday(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
}

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function DirectionIcon({ dir }: { dir: string }) {
  if (dir === 'up') return <ArrowUp size={14} className="dir-up" />;
  if (dir === 'down') return <ArrowDown size={14} className="dir-down" />;
  return <Minus size={14} className="dir-equal" />;
}

function CompareLabel({ comp, suffix }: { comp: ComparisonValue | undefined; suffix?: string }) {
  if (!comp || comp.previous === null) return null;
  return (
    <span className={`compare-badge dir-${comp.direction}`}>
      <DirectionIcon dir={comp.direction} />
      {comp.previous}{suffix || ''}
    </span>
  );
}

function getInsight(report: WeeklyReportType): string {
  const parts: string[] = [];
  if (report.days_logged === 0) return 'No registraste ningun dia esta semana. Empieza manana!';
  if (report.days_logged >= 5) parts.push('Excelente consistencia registrando tus dias.');
  else if (report.days_logged >= 3) parts.push('Buen ritmo de registro.');
  else parts.push('Intenta registrar mas dias para ver tendencias claras.');

  if (report.avg_sleep !== null) {
    if (report.avg_sleep >= 7) parts.push('Tu sueno esta en buen rango.');
    else parts.push('Dormiste menos de 7h en promedio, prioriza descanso.');
  }

  if (report.avg_energy !== null && report.avg_mood !== null) {
    if (report.avg_energy >= 4 && report.avg_mood >= 4) parts.push('Animo y energia altos!');
    else if (report.avg_energy < 3) parts.push('Energia baja, revisa sueno y alimentacion.');
  }

  const comp = report.comparison;
  if (comp) {
    if (comp.points?.direction === 'up') parts.push('Mejoraste en puntos vs la semana pasada.');
    if (comp.points?.direction === 'down') parts.push('Bajaste en puntos, pero cada semana es nueva.');
  }

  return parts.join(' ');
}

export default function WeeklyReport() {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/reports/weekly', { params: { start_date: formatDateStr(monday) } }),
      api.get('/reports/streaks'),
    ])
      .then(([reportRes, streakRes]) => {
        setReport(reportRes.data);
        setStreak(streakRes.data);
      })
      .catch((err) => { setReport(null); setError(getErrorMessage(err)); })
      .finally(() => setLoading(false));
  }, [monday]);

  const prevWeek = () => setMonday(new Date(monday.getTime() - 7 * 86400000));
  const nextWeek = () => {
    const next = new Date(monday.getTime() + 7 * 86400000);
    if (next <= new Date()) setMonday(next);
  };

  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const fmtDate = (d: Date) => d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
  const comp = report?.comparison;

  return (
    <div className="report-page">
      <header className="page-header">
        <h1>Reporte Semanal</h1>
      </header>

      <div className="week-nav">
        <button className="btn-icon" onClick={prevWeek}><ChevronLeft size={24} /></button>
        <span className="week-range">{fmtDate(monday)} - {fmtDate(sunday)}</span>
        <button className="btn-icon" onClick={nextWeek}><ChevronRight size={24} /></button>
      </div>

      {loading && <div className="loading-state"><Loader2 size={28} className="spin" /> Cargando reporte...</div>}
      {error && (
        <div className="error-state">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => setMonday(new Date(monday))}>Reintentar</button>
        </div>
      )}

      {!loading && !error && report && (
        <>
          {streak && (
            <div className="streak-row">
              <div className="streak-pill"><Flame size={16} /> Racha: {streak.current_streak} dias</div>
              <div className="streak-pill"><Trophy size={16} /> Mejor: {streak.best_streak}</div>
            </div>
          )}

          <div className="report-summary">
            <div className="card stat-card highlight">
              <Trophy size={28} />
              <div className="stat-value">{report.total_points}</div>
              <div className="stat-label">Puntos totales</div>
              <CompareLabel comp={comp?.points} />
            </div>
            <div className="card stat-card">
              <Star size={22} />
              <div className="stat-value">{report.days_logged}/7</div>
              <div className="stat-label">Dias registrados</div>
            </div>
            <div className="card stat-card">
              <Moon size={22} />
              <div className="stat-value">{report.avg_sleep ?? '--'}</div>
              <div className="stat-label">Prom. sueno</div>
              <CompareLabel comp={comp?.sleep} suffix="h" />
            </div>
            <div className="card stat-card">
              <Heart size={22} />
              <div className="stat-value">{report.avg_mood ?? '--'}</div>
              <div className="stat-label">Prom. animo</div>
              <CompareLabel comp={comp?.mood} />
            </div>
            <div className="card stat-card">
              <Zap size={22} />
              <div className="stat-value">{report.avg_energy ?? '--'}</div>
              <div className="stat-label">Prom. energia</div>
              <CompareLabel comp={comp?.energy} />
            </div>
          </div>

          <div className="card insight-card">
            <Lightbulb size={20} />
            <p>{getInsight(report)}</p>
          </div>

          <div className="card">
            <h2>Tiempo invertido</h2>
            <div className="time-stats">
              <div className="time-item">
                <GraduationCap size={18} />
                <span>Estudio U</span>
                <strong>{report.total_study_minutes} min</strong>
                <CompareLabel comp={comp?.study} suffix="m" />
              </div>
              <div className="time-item">
                <Languages size={18} />
                <span>Ingles</span>
                <strong>{report.total_english_minutes} min</strong>
                <CompareLabel comp={comp?.english} suffix="m" />
              </div>
              <div className="time-item">
                <Code size={18} />
                <span>Programacion</span>
                <strong>{report.total_programming_minutes} min</strong>
                <CompareLabel comp={comp?.programming} suffix="m" />
              </div>
              <div className="time-item">
                <BookOpen size={18} />
                <span>Lectura</span>
                <strong>{report.total_reading_minutes} min</strong>
                <CompareLabel comp={comp?.reading} suffix="m" />
              </div>
              <div className="time-item">
                <Brain size={18} />
                <span>Meditacion</span>
                <strong>{report.total_meditation_minutes} min</strong>
                <CompareLabel comp={comp?.meditation} suffix="m" />
              </div>
            </div>
          </div>

          {report.habits_most_completed.length > 0 && (
            <div className="card">
              <h2><TrendingUp size={18} /> Habitos mas cumplidos</h2>
              <div className="habit-ranking">
                {report.habits_most_completed.map((h, i) => (
                  <div key={h.habit_id} className="rank-item rank-top">
                    <span className="rank-num">#{i + 1}</span>
                    <span className="rank-name">{h.name}</span>
                    <span className="rank-days">{h.days_completed} dias</span>
                    <span className="rank-points">{h.total_points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.habits_least_completed.length > 0 && report.habits_most_completed.length > 3 && (
            <div className="card">
              <h2><TrendingDown size={18} /> Habitos por mejorar</h2>
              <div className="habit-ranking">
                {report.habits_least_completed.map((h) => (
                  <div key={h.habit_id} className="rank-item rank-bottom">
                    <span className="rank-name">{h.name}</span>
                    <span className="rank-days">{h.days_completed} dias</span>
                    <span className="rank-points">{h.total_points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && report && report.days_logged === 0 && (
        <div className="card empty-state">
          <p>No hay datos para esta semana. Empieza a registrar tu dia.</p>
        </div>
      )}
    </div>
  );
}
