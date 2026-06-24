import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import type { TrendsResponse, StreakResponse } from '../api/types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Flame, Trophy, Shield, Moon, Heart, Zap, Star,
  GraduationCap, AlertCircle, Loader2
} from 'lucide-react';

export default function Trends() {
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/reports/trends', { params: { days } }),
      api.get('/reports/streaks'),
    ])
      .then(([trendsRes, streakRes]) => {
        setTrends(trendsRes.data);
        setStreak(streakRes.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [days]);

  const fmt = (d: string) => {
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  if (loading) {
    return (
      <div className="trends-page">
        <div className="loading-state"><Loader2 size={28} className="spin" /> Cargando tendencias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trends-page">
        <div className="error-state">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => setDays(days)}>Reintentar</button>
        </div>
      </div>
    );
  }

  const data = trends?.data || [];
  const chartData = data.map((d) => ({ ...d, label: fmt(d.date) }));

  return (
    <div className="trends-page">
      <header className="page-header">
        <h1>Progreso</h1>
        <div className="days-selector">
          {[7, 14, 30].map((n) => (
            <button
              key={n}
              className={`btn ${days === n ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setDays(n)}
            >{n}d</button>
          ))}
        </div>
      </header>

      {streak && (
        <div className="streak-cards">
          <div className="card streak-card streak-current">
            <Flame size={24} />
            <div className="streak-value">{streak.current_streak}</div>
            <div className="streak-label">Racha actual</div>
          </div>
          <div className="card streak-card">
            <Trophy size={24} />
            <div className="streak-value">{streak.best_streak}</div>
            <div className="streak-label">Mejor racha</div>
          </div>
          <div className="card streak-card">
            <Shield size={24} />
            <div className="streak-value">{streak.grace_days_used_this_week}</div>
            <div className="streak-label">Dias de gracia</div>
          </div>
        </div>
      )}

      <div className="card chart-card">
        <h2><Star size={18} /> Puntos diarios</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-light)' }} />
              <YAxis fontSize={11} tick={{ fill: 'var(--text-light)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
              />
              <Bar dataKey="points" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Puntos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card chart-card">
        <h2><Moon size={18} /> Sueno (horas)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-light)' }} />
              <YAxis domain={[0, 12]} fontSize={11} tick={{ fill: 'var(--text-light)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
              <Line type="monotone" dataKey="sleep_hours" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} name="Horas" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="card chart-card">
          <h2><Heart size={18} /> Animo</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: 'var(--text-light)' }} />
                <YAxis domain={[1, 5]} fontSize={10} tick={{ fill: 'var(--text-light)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <Line type="monotone" dataKey="mood" stroke="#f472b6" strokeWidth={2} dot={{ r: 3 }} name="Animo" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card chart-card">
          <h2><Zap size={18} /> Energia</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: 'var(--text-light)' }} />
                <YAxis domain={[1, 5]} fontSize={10} tick={{ fill: 'var(--text-light)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <Line type="monotone" dataKey="energy" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} name="Energia" connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card chart-card">
        <h2><GraduationCap size={18} /> Tiempo invertido (min)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} tick={{ fill: 'var(--text-light)' }} />
              <YAxis fontSize={11} tick={{ fill: 'var(--text-light)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="university_study_minutes" fill="#6366f1" name="Estudio" stackId="a" />
              <Bar dataKey="english_minutes" fill="#22c55e" name="Ingles" stackId="a" />
              <Bar dataKey="programming_minutes" fill="#f59e0b" name="Programacion" stackId="a" />
              <Bar dataKey="reading_minutes" fill="#ec4899" name="Lectura" stackId="a" />
              <Bar dataKey="meditation_minutes" fill="#8b5cf6" name="Meditacion" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#6366f1' }}></span>Estudio</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }}></span>Ingles</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }}></span>Prog</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#ec4899' }}></span>Lectura</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }}></span>Medit</span>
        </div>
      </div>
    </div>
  );
}
