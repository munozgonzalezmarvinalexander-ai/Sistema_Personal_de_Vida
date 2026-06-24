import { useState, useEffect } from 'react';
import api from '../api/client';
import type { WeeklyReport as WeeklyReportType } from '../api/types';
import {
  ChevronLeft, ChevronRight, Moon, Heart, Zap, GraduationCap,
  Languages, Code, BookOpen, Brain, Trophy, Star
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

export default function WeeklyReport() {
  const [monday, setMonday] = useState(() => getMonday(new Date()));
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/reports/weekly', { params: { start_date: formatDateStr(monday) } })
      .then((res) => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [monday]);

  const prevWeek = () => setMonday(new Date(monday.getTime() - 7 * 86400000));
  const nextWeek = () => {
    const next = new Date(monday.getTime() + 7 * 86400000);
    if (next <= new Date()) setMonday(next);
  };

  const sunday = new Date(monday.getTime() + 6 * 86400000);

  const fmtDate = (d: Date) => d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });

  return (
    <div className="report-page">
      <header className="page-header">
        <h1>Reporte Semanal</h1>
      </header>

      <div className="week-nav">
        <button className="btn-icon" onClick={prevWeek}><ChevronLeft size={24} /></button>
        <span className="week-range">{fmtDate(monday)} — {fmtDate(sunday)}</span>
        <button className="btn-icon" onClick={nextWeek}><ChevronRight size={24} /></button>
      </div>

      {loading && <p className="loading">Cargando...</p>}

      {!loading && report && (
        <>
          <div className="report-summary">
            <div className="card stat-card highlight">
              <Trophy size={28} />
              <div className="stat-value">{report.total_points}</div>
              <div className="stat-label">Puntos totales</div>
            </div>
            <div className="card stat-card">
              <Star size={22} />
              <div className="stat-value">{report.days_logged}/7</div>
              <div className="stat-label">Días registrados</div>
            </div>
            <div className="card stat-card">
              <Moon size={22} />
              <div className="stat-value">{report.avg_sleep ?? '—'}</div>
              <div className="stat-label">Promedio sueño</div>
            </div>
            <div className="card stat-card">
              <Heart size={22} />
              <div className="stat-value">{report.avg_mood ?? '—'}</div>
              <div className="stat-label">Promedio ánimo</div>
            </div>
            <div className="card stat-card">
              <Zap size={22} />
              <div className="stat-value">{report.avg_energy ?? '—'}</div>
              <div className="stat-label">Promedio energía</div>
            </div>
          </div>

          <div className="card">
            <h2>Tiempo invertido</h2>
            <div className="time-stats">
              <div className="time-item">
                <GraduationCap size={18} />
                <span>Estudio U</span>
                <strong>{report.total_study_minutes} min</strong>
              </div>
              <div className="time-item">
                <Languages size={18} />
                <span>Inglés</span>
                <strong>{report.total_english_minutes} min</strong>
              </div>
              <div className="time-item">
                <Code size={18} />
                <span>Programación</span>
                <strong>{report.total_programming_minutes} min</strong>
              </div>
              <div className="time-item">
                <BookOpen size={18} />
                <span>Lectura</span>
                <strong>{report.total_reading_minutes} min</strong>
              </div>
              <div className="time-item">
                <Brain size={18} />
                <span>Meditación</span>
                <strong>{report.total_meditation_minutes} min</strong>
              </div>
            </div>
          </div>

          {report.habits_most_completed.length > 0 && (
            <div className="card">
              <h2>Hábitos más cumplidos</h2>
              <div className="habit-ranking">
                {report.habits_most_completed.map((h, i) => (
                  <div key={h.habit_id} className="rank-item">
                    <span className="rank-num">#{i + 1}</span>
                    <span className="rank-name">{h.name}</span>
                    <span className="rank-days">{h.days_completed} días</span>
                    <span className="rank-points">{h.total_points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !report && (
        <div className="card empty-state">
          <p>No hay datos para esta semana. Empieza a registrar tu día.</p>
        </div>
      )}
    </div>
  );
}
