import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import type { Experiment, ExperimentCreate, ExperimentDecision } from '../api/types';
import {
  Plus, X, FlaskConical, CheckCircle2, XCircle, Clock,
  Calendar, Target, AlertCircle, Loader2, Trash2
} from 'lucide-react';

const METRICS = [
  'Calidad de sueno', 'Energia', 'Animo', 'Concentracion',
  'Comprension auditiva', 'Productividad', 'Estres', 'Otro',
];

const DECISION_LABELS: Record<ExperimentDecision, { label: string; color: string }> = {
  adopt: { label: 'Adoptar', color: 'var(--success)' },
  adjust: { label: 'Ajustar', color: 'var(--warning)' },
  discard: { label: 'Descartar', color: 'var(--danger)' },
};

function daysProgress(start: string, end: string): { elapsed: number; remaining: number; percent: number; total: number } {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const total = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  const elapsed = Math.max(0, Math.min(total, Math.round((now.getTime() - s.getTime()) / 86400000) + 1));
  const remaining = Math.max(0, total - elapsed);
  const percent = Math.round((elapsed / total) * 100);
  return { elapsed, remaining, percent, total };
}

export default function Experiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [completing, setCompleting] = useState<Experiment | null>(null);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState<ExperimentCreate>({
    title: '', hypothesis: '', metric_tracked: METRICS[0],
    duration_days: 14, start_date: new Date().toISOString().split('T')[0],
  });

  const [completeForm, setCompleteForm] = useState({ result: '', decision: 'adopt' as ExperimentDecision });

  const loadExperiments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/experiments');
      setExperiments(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExperiments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('El titulo es requerido'); return; }
    if (!form.hypothesis.trim()) { setFormError('La hipotesis es requerida'); return; }
    try {
      await api.post('/experiments', form);
      setShowCreate(false);
      setForm({ title: '', hypothesis: '', metric_tracked: METRICS[0], duration_days: 14, start_date: new Date().toISOString().split('T')[0] });
      loadExperiments();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleComplete = async () => {
    if (!completing) return;
    if (!completeForm.result.trim()) { setFormError('El resultado es requerido'); return; }
    try {
      await api.patch(`/experiments/${completing.id}/complete`, completeForm);
      setCompleting(null);
      setCompleteForm({ result: '', decision: 'adopt' });
      loadExperiments();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar este experimento?')) return;
    try {
      await api.patch(`/experiments/${id}/cancel`);
      loadExperiments();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este experimento?')) return;
    try {
      await api.delete(`/experiments/${id}`);
      loadExperiments();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const active = experiments.filter((e) => e.status === 'active');
  const completed = experiments.filter((e) => e.status === 'completed');
  const cancelled = experiments.filter((e) => e.status === 'cancelled');

  if (loading) {
    return <div className="experiments-page"><div className="loading-state"><Loader2 size={28} className="spin" /> Cargando experimentos...</div></div>;
  }

  return (
    <div className="experiments-page">
      <header className="page-header">
        <div>
          <h1>Experimentos</h1>
          <p className="page-subtitle">Prueba habitos por tiempo limitado y decide con datos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> Nuevo
        </button>
      </header>

      <div className="card experiment-intro">
        <FlaskConical size={20} />
        <p>Un experimento no es un compromiso permanente. Es una prueba temporal para descubrir que habitos realmente te ayudan.</p>
      </div>

      {error && <div className="error-msg"><AlertCircle size={16} /> {error}</div>}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo experimento</h2>
              <button className="btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              {formError && <div className="error-msg">{formError}</div>}
              <div className="form-group">
                <label>Titulo</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ej: Meditar 5 min en la manana" />
              </div>
              <div className="form-group">
                <label>Descripcion (opcional)</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value || undefined })} placeholder="Que vas a hacer exactamente?" rows={2} />
              </div>
              <div className="form-group">
                <label>Hipotesis</label>
                <textarea value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} required placeholder="Creo que ___ mejorara mi ___" rows={2} />
              </div>
              <div className="form-group">
                <label>Metrica a observar</label>
                <select value={form.metric_tracked} onChange={(e) => setForm({ ...form, metric_tracked: e.target.value })}>
                  {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duracion</label>
                  <select value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) as 7 | 14 | 30 })}>
                    <option value={7}>7 dias</option>
                    <option value={14}>14 dias</option>
                    <option value={30}>30 dias</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha inicio</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear experimento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completing && (
        <div className="modal-overlay" onClick={() => setCompleting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Completar: {completing.title}</h2>
              <button className="btn-icon" onClick={() => setCompleting(null)}><X size={20} /></button>
            </div>
            <div className="complete-info">
              <p><strong>Hipotesis:</strong> {completing.hypothesis}</p>
              <p><strong>Metrica:</strong> {completing.metric_tracked}</p>
            </div>
            {formError && <div className="error-msg">{formError}</div>}
            <div className="form-group">
              <label>Resultado: que observaste?</label>
              <textarea value={completeForm.result} onChange={(e) => setCompleteForm({ ...completeForm, result: e.target.value })} placeholder="Describe que paso durante el experimento" rows={3} />
            </div>
            <div className="form-group">
              <label>Decision final</label>
              <div className="decision-buttons">
                {(['adopt', 'adjust', 'discard'] as ExperimentDecision[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn decision-btn ${completeForm.decision === d ? 'active' : ''}`}
                    style={{ '--dec-color': DECISION_LABELS[d].color } as React.CSSProperties}
                    onClick={() => setCompleteForm({ ...completeForm, decision: d })}
                  >
                    {DECISION_LABELS[d].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setCompleting(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleComplete}>Guardar resultado</button>
            </div>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="section-title"><Clock size={18} /> Activos ({active.length})</h2>
          <div className="experiments-grid">
            {active.map((exp) => {
              const prog = daysProgress(exp.start_date, exp.end_date);
              return (
                <div key={exp.id} className="card experiment-card experiment-active">
                  <div className="exp-header">
                    <h3>{exp.title}</h3>
                    <span className="exp-duration">{exp.duration_days}d</span>
                  </div>
                  {exp.description && <p className="exp-desc">{exp.description}</p>}
                  <p className="exp-hypothesis"><Target size={14} /> {exp.hypothesis}</p>
                  <p className="exp-metric"><FlaskConical size={14} /> {exp.metric_tracked}</p>
                  <div className="exp-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${prog.percent}%` }}></div>
                    </div>
                    <div className="progress-info">
                      <span>Dia {prog.elapsed} de {prog.total}</span>
                      <span>{prog.remaining > 0 ? `${prog.remaining} restantes` : 'Periodo completado'}</span>
                    </div>
                  </div>
                  <div className="exp-dates">
                    <Calendar size={14} /> {exp.start_date} - {exp.end_date}
                  </div>
                  <div className="exp-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => { setCompleting(exp); setFormError(''); setCompleteForm({ result: '', decision: 'adopt' }); }}>
                      <CheckCircle2 size={14} /> Completar
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(exp.id)}>
                      <XCircle size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="section-title"><CheckCircle2 size={18} /> Completados ({completed.length})</h2>
          <div className="experiments-grid">
            {completed.map((exp) => (
              <div key={exp.id} className="card experiment-card experiment-completed">
                <div className="exp-header">
                  <h3>{exp.title}</h3>
                  {exp.decision && (
                    <span className="decision-badge" style={{ color: DECISION_LABELS[exp.decision as ExperimentDecision].color }}>
                      {DECISION_LABELS[exp.decision as ExperimentDecision].label}
                    </span>
                  )}
                </div>
                <p className="exp-hypothesis"><Target size={14} /> {exp.hypothesis}</p>
                {exp.result && <p className="exp-result"><strong>Resultado:</strong> {exp.result}</p>}
                <div className="exp-dates">
                  <Calendar size={14} /> {exp.start_date} - {exp.end_date} ({exp.duration_days}d)
                </div>
                <div className="exp-actions">
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(exp.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section>
          <h2 className="section-title"><XCircle size={18} /> Cancelados ({cancelled.length})</h2>
          <div className="experiments-grid">
            {cancelled.map((exp) => (
              <div key={exp.id} className="card experiment-card experiment-cancelled">
                <div className="exp-header">
                  <h3>{exp.title}</h3>
                  <span className="exp-duration">{exp.duration_days}d</span>
                </div>
                <p className="exp-hypothesis"><Target size={14} /> {exp.hypothesis}</p>
                <div className="exp-dates">
                  <Calendar size={14} /> {exp.start_date} - {exp.end_date}
                </div>
                <div className="exp-actions">
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(exp.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {experiments.length === 0 && (
        <div className="card empty-state">
          <FlaskConical size={32} />
          <p>No tienes experimentos. Crea el primero para probar un habito nuevo.</p>
        </div>
      )}
    </div>
  );
}
