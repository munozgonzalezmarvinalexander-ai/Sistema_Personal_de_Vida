import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import type { Insight, InsightSummary, CorrelationsResponse, Correlation } from '../api/types';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Lightbulb, AlertTriangle, TrendingUp, ArrowRight,
  AlertCircle, Loader2, Filter, Info, TrendingDown,
  ArrowUpRight, ArrowDownRight, BarChart3, Clock
} from 'lucide-react';

const PRIORITY_STYLES: Record<string, { cls: string; label: string }> = {
  high: { cls: 'priority-high', label: 'Alta' },
  medium: { cls: 'priority-medium', label: 'Media' },
  low: { cls: 'priority-low', label: 'Baja' },
};

const STRENGTH_LABELS: Record<string, string> = {
  strong: 'Fuerte',
  moderate: 'Moderada',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const DAYS_OPTIONS = [14, 30, 60, 90];

const LAG_OPTIONS = [
  { value: 0, label: 'Mismo dia' },
  { value: 1, label: 'Dia anterior → dia actual' },
];

const CATEGORIES = ['sueno', 'bienestar', 'salud', 'aprendizaje', 'habitos', 'experimentos', 'general'];

export default function Insights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState<InsightSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [prioFilter, setPrioFilter] = useState('');

  const [corrData, setCorrData] = useState<CorrelationsResponse | null>(null);
  const [corrDays, setCorrDays] = useState(30);
  const [corrLag, setCorrLag] = useState(0);
  const [corrLoading, setCorrLoading] = useState(false);
  const [corrError, setCorrError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/insights'),
      api.get('/insights/summary'),
    ])
      .then(([insRes, sumRes]: [{ data: Insight[] }, { data: InsightSummary }]) => {
        setInsights(insRes.data);
        setSummary(sumRes.data);
      })
      .catch((err: unknown) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCorrLoading(true);
    setCorrError('');
    api.get(`/insights/correlations?days=${corrDays}&lag=${corrLag}`)
      .then((res: { data: CorrelationsResponse }) => setCorrData(res.data))
      .catch((err: unknown) => setCorrError(getErrorMessage(err)))
      .finally(() => setCorrLoading(false));
  }, [corrDays, corrLag]);

  const filtered = insights.filter((i) => {
    if (catFilter && i.category !== catFilter) return false;
    if (prioFilter && i.priority !== prioFilter) return false;
    return true;
  });

  const handleAction = (target: string) => {
    const routes: Record<string, string> = {
      library: '/library', experiments: '/experiments',
      today: '/', habits: '/habits', reminders: '/reminders',
    };
    if (routes[target]) navigate(routes[target]);
  };

  if (loading) {
    return <div className="insights-page"><div className="loading-state"><Loader2 size={28} className="spin" /> Analizando tus datos...</div></div>;
  }

  if (error) {
    return <div className="insights-page"><div className="error-state"><AlertCircle size={28} /><p>{error}</p></div></div>;
  }

  return (
    <div className="insights-page">
      <header className="page-header">
        <h1>Sugerencias</h1>
      </header>

      <div className="card insight-disclaimer">
        <Info size={16} />
        <p>Estas sugerencias se generan con reglas locales a partir de tus datos. No se usa IA externa ni se envian datos a terceros. No son consejo medico.</p>
      </div>

      {summary && (
        <div className="card insight-summary-card">
          <div className="insight-summary-msg">
            <Lightbulb size={22} />
            <p>{summary.general_message}</p>
          </div>
          <div className="insight-summary-stats">
            <span className="prio-count priority-high">{summary.high_priority} alta</span>
            <span className="prio-count priority-medium">{summary.medium_priority} media</span>
            <span className="prio-count priority-low">{summary.low_priority} baja</span>
          </div>
          {summary.needs_attention && (
            <p className="insight-attention"><AlertTriangle size={14} /> Necesita atencion: {summary.needs_attention}</p>
          )}
          {summary.best_metric && (
            <p className="insight-best"><TrendingUp size={14} /> Mejorando: {summary.best_metric}</p>
          )}
        </div>
      )}

      <div className="insight-filters">
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">Todas las categorias</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value)}>
          <option value="">Todas las prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
        {(catFilter || prioFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setCatFilter(''); setPrioFilter(''); }}>
            <Filter size={14} /> Limpiar
          </button>
        )}
      </div>

      <div className="insights-list">
        {filtered.map((insight) => (
          <div key={insight.id} className={`card insight-card ${PRIORITY_STYLES[insight.priority].cls}`}>
            <div className="insight-card-header">
              <h3>{insight.title}</h3>
              <span className={`prio-badge ${PRIORITY_STYLES[insight.priority].cls}`}>
                {PRIORITY_STYLES[insight.priority].label}
              </span>
            </div>
            <p className="insight-msg">{insight.message}</p>
            <p className="insight-rec">{insight.recommendation}</p>
            <div className="insight-meta">
              <span className="insight-cat">{insight.category}</span>
              <span className="insight-period">{insight.period_days}d</span>
              <span className="insight-confidence">Confianza: {insight.confidence}</span>
            </div>
            {insight.action_label && insight.action_target && (
              <button className="btn btn-secondary btn-sm insight-action" onClick={() => handleAction(insight.action_target!)}>
                {insight.action_label} <ArrowRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card empty-state">
          <Lightbulb size={32} />
          <p>No hay sugerencias con estos filtros. Registra mas dias para obtener insights.</p>
        </div>
      )}

      <section className="correlations-section" data-testid="correlations-section">
        <div className="correlations-header">
          <h2><BarChart3 size={20} /> Patrones detectados</h2>
          <div className="corr-selectors">
            <select
              className="corr-lag-select"
              data-testid="lag-selector"
              value={corrLag}
              onChange={(e) => setCorrLag(Number(e.target.value))}
            >
              {LAG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="corr-days-select"
              value={corrDays}
              onChange={(e) => setCorrDays(Number(e.target.value))}
            >
              {DAYS_OPTIONS.map((d) => (
                <option key={d} value={d}>{d} dias</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card insight-disclaimer">
          <Info size={16} />
          <p>Los patrones muestran relaciones observadas, no causalidad. No son consejo medico ni afirmaciones absolutas.</p>
        </div>

        {corrLoading && (
          <div className="loading-state"><Loader2 size={22} className="spin" /> Calculando patrones...</div>
        )}

        {corrError && (
          <div className="error-state"><AlertCircle size={22} /><p>{corrError}</p></div>
        )}

        {!corrLoading && !corrError && corrData && (
          <>
            {corrData.correlations.length === 0 ? (
              <div className="card empty-state" data-testid="correlations-empty">
                <BarChart3 size={32} />
                <p>{corrData.message}</p>
                {corrData.sample_size < 7 && corrLag === 0 && (
                  <p className="corr-hint">Necesitas mas registros para detectar patrones confiables.</p>
                )}
                {corrLag === 1 && (
                  <p className="corr-hint" data-testid="lag-insufficient">Necesitas mas registros consecutivos para analizar patrones con retardo.</p>
                )}
              </div>
            ) : (
              <>
                <p className="corr-summary-msg">{corrData.message}</p>
                <div className="correlations-list">
                  {corrData.correlations.map((corr) => (
                    <CorrelationCard key={corr.id} corr={corr} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CorrelationCard({ corr }: { corr: Correlation }) {
  const isPositive = corr.direction === 'positive';
  const DirectionIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const strengthCls = corr.strength === 'strong' ? 'corr-strong' : 'corr-moderate';
  const hasPoints = corr.data_points && corr.data_points.length > 0;

  return (
    <div className={`card corr-card ${strengthCls}`} data-testid="correlation-card">
      <div className="corr-card-header">
        <div className="corr-metrics">
          <span className="corr-metric-tag">{corr.label_x}</span>
          <DirectionIcon size={16} className={`corr-dir-icon ${isPositive ? 'corr-positive' : 'corr-negative'}`} />
          <span className="corr-metric-tag">{corr.label_y}</span>
        </div>
        <div className="corr-badges">
          {corr.lag_days > 0 && (
            <span className="corr-lag-badge" data-testid="lag-badge">
              <Clock size={10} /> Retardo
            </span>
          )}
          <span className={`corr-strength-badge ${strengthCls}`}>
            {STRENGTH_LABELS[corr.strength]}
          </span>
        </div>
      </div>

      <p className="corr-message">
        <TrendIcon size={14} className={isPositive ? 'corr-positive' : 'corr-negative'} />
        {corr.message}
      </p>

      {hasPoints && (
        <div className="corr-scatter" data-testid="scatter-plot">
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                dataKey="x"
                name={corr.label_x}
                tick={{ fontSize: 10 }}
                label={{ value: corr.label_x, position: 'bottom', fontSize: 11, offset: 0 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={corr.label_y}
                tick={{ fontSize: 10 }}
                label={{ value: corr.label_y, angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                data={corr.data_points}
                fill={isPositive ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)'}
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="corr-recommendation">{corr.recommendation}</p>

      <div className="corr-meta">
        <span className="corr-coeff" title="Coeficiente de Pearson">
          r = {corr.coefficient > 0 ? '+' : ''}{corr.coefficient}
        </span>
        <span className="corr-sample">{corr.sample_size} dias</span>
        <span className="corr-conf">Confianza: {CONFIDENCE_LABELS[corr.confidence]}</span>
        {corr.lag_days > 0 && (
          <span className="corr-lag-info">
            <Clock size={10} /> dia anterior → dia siguiente
          </span>
        )}
      </div>
    </div>
  );
}
