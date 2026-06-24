import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import type { UserProgress, AchievementsList } from '../api/types';
import {
  Award, Star, CalendarCheck, ListChecks, FlaskConical, Trophy,
  Lock, AlertCircle, Loader2
} from 'lucide-react';

export default function Achievements() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<AchievementsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/gamification/progress'),
      api.get('/gamification/achievements'),
    ])
      .then(([progRes, achRes]) => {
        setProgress(progRes.data);
        setAchievements(achRes.data);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="achievements-page"><div className="loading-state"><Loader2 size={28} className="spin" /> Cargando progreso...</div></div>;
  }

  if (error) {
    return <div className="achievements-page"><div className="error-state"><AlertCircle size={28} /><p>{error}</p></div></div>;
  }

  return (
    <div className="achievements-page">
      <header className="page-header">
        <h1>Progreso Personal</h1>
      </header>

      {progress && (
        <>
          <div className="card level-card">
            <div className="level-header">
              <div className="level-circle">
                <span className="level-number">{progress.level}</span>
              </div>
              <div className="level-info">
                <h2>Nivel {progress.level}</h2>
                <p className="level-points">{progress.total_points} puntos acumulados</p>
              </div>
            </div>
            <div className="level-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress.progress_pct}%` }}></div>
              </div>
              <div className="progress-info">
                <span>{progress.points_in_level} / {progress.points_needed > 0 ? progress.points_needed : 'MAX'}</span>
                <span>{progress.progress_pct}%</span>
              </div>
            </div>
            {progress.points_needed > 0 && (
              <p className="level-next">Siguiente nivel: {progress.next_threshold} puntos</p>
            )}
          </div>

          <div className="stats-row">
            <div className="card stat-mini">
              <CalendarCheck size={20} />
              <div className="stat-mini-value">{progress.total_checkins}</div>
              <div className="stat-mini-label">Check-ins</div>
            </div>
            <div className="card stat-mini">
              <ListChecks size={20} />
              <div className="stat-mini-value">{progress.total_habits_completed}</div>
              <div className="stat-mini-label">Habitos cumplidos</div>
            </div>
            <div className="card stat-mini">
              <FlaskConical size={20} />
              <div className="stat-mini-value">{progress.total_experiments_completed}</div>
              <div className="stat-mini-label">Experimentos</div>
            </div>
            <div className="card stat-mini">
              <Trophy size={20} />
              <div className="stat-mini-value">{progress.total_achievements}</div>
              <div className="stat-mini-label">Logros</div>
            </div>
          </div>
        </>
      )}

      {achievements && achievements.unlocked.length > 0 && (
        <section>
          <h2 className="section-title"><Award size={18} /> Logros desbloqueados ({achievements.unlocked.length})</h2>
          <div className="achievements-grid">
            {achievements.unlocked.map((a) => (
              <div key={a.id} className="card achievement-card unlocked">
                <div className="ach-icon"><Star size={24} /></div>
                <div className="ach-content">
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <span className="ach-date">{new Date(a.unlocked_at).toLocaleDateString('es-GT')}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {achievements && achievements.available.length > 0 && (
        <section>
          <h2 className="section-title"><Lock size={18} /> Logros pendientes ({achievements.available.length})</h2>
          <div className="achievements-grid">
            {achievements.available.map((a) => (
              <div key={a.code} className="card achievement-card locked">
                <div className="ach-icon locked-icon"><Lock size={20} /></div>
                <div className="ach-content">
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
