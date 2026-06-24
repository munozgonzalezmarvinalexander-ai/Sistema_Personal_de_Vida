import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import type { HabitLibraryItem, EvidenceType, DifficultyLevel } from '../api/types';
import {
  Search, BookMarked, X, Clock, AlertTriangle, ExternalLink,
  Plus, FlaskConical, AlertCircle, Loader2, Filter
} from 'lucide-react';

const EVIDENCE_LABELS: Record<EvidenceType, { label: string; cls: string }> = {
  science: { label: 'Evidencia cientifica', cls: 'ev-science' },
  tradition: { label: 'Tradicion cultural', cls: 'ev-tradition' },
  personal: { label: 'Experiencia personal', cls: 'ev-personal' },
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta',
};

const CATEGORIES = [
  'salud', 'sueno', 'alimentacion', 'bienestar', 'estudio',
  'aprendizaje', 'desarrollo', 'salud_mental', 'orden', 'finanzas', 'filosofia',
];

export default function Library() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HabitLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<HabitLibraryItem | null>(null);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [evFilter, setEvFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (catFilter) params.category = catFilter;
    if (evFilter) params.evidence_type = evFilter;
    if (diffFilter) params.difficulty = diffFilter;
    if (search.trim()) params.search = search.trim();
    api.get('/habit-library', { params })
      .then((res) => setItems(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [catFilter, evFilter, diffFilter, search]);

  const handleCreateHabit = (item: HabitLibraryItem) => {
    const habitData = {
      name: item.name,
      category: item.category,
      level_min: `${Math.max(1, Math.round(item.daily_minutes * 0.3))} min - version minima`,
      level_normal: `${item.daily_minutes} min - ${item.how_to_start.substring(0, 50)}`,
      level_ideal: `${Math.round(item.daily_minutes * 1.5)} min - version completa`,
      is_core: false,
    };
    api.post('/habits', habitData)
      .then(() => { setDetail(null); navigate('/habits'); })
      .catch((err) => setError(getErrorMessage(err)));
  };

  const handleCreateExperiment = (item: HabitLibraryItem) => {
    const today = new Date().toISOString().split('T')[0];
    const expData = {
      title: item.name,
      description: item.description,
      hypothesis: `Creo que ${item.name.toLowerCase()} mejorara mi ${item.benefit.split(',')[0].toLowerCase().trim()}`,
      metric_tracked: item.benefit.split(',')[0].trim(),
      duration_days: 14,
      start_date: today,
    };
    api.post('/experiments', expData)
      .then(() => { setDetail(null); navigate('/experiments'); })
      .catch((err) => setError(getErrorMessage(err)));
  };

  const activeFilters = [catFilter, evFilter, diffFilter].filter(Boolean).length;

  if (loading && items.length === 0) {
    return <div className="library-page"><div className="loading-state"><Loader2 size={28} className="spin" /> Cargando biblioteca...</div></div>;
  }

  return (
    <div className="library-page">
      <header className="page-header">
        <div>
          <h1>Biblioteca</h1>
          <p className="page-subtitle">Habitos investigados y clasificados por tipo de evidencia</p>
        </div>
      </header>

      {error && <div className="error-msg"><AlertCircle size={16} /> {error}</div>}

      <div className="library-search">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar habitos..."
          />
          {search && <button className="btn-icon" onClick={() => setSearch('')}><X size={16} /></button>}
        </div>
        <button className={`btn btn-secondary btn-sm ${activeFilters > 0 ? 'filter-active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} /> Filtros {activeFilters > 0 && `(${activeFilters})`}
        </button>
      </div>

      {showFilters && (
        <div className="library-filters">
          <div className="filter-group">
            <label>Categoria</label>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">Todas</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Evidencia</label>
            <select value={evFilter} onChange={(e) => setEvFilter(e.target.value)}>
              <option value="">Todos</option>
              <option value="science">Cientifica</option>
              <option value="tradition">Tradicion</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Dificultad</label>
            <select value={diffFilter} onChange={(e) => setDiffFilter(e.target.value)}>
              <option value="">Todas</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          {activeFilters > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setCatFilter(''); setEvFilter(''); setDiffFilter(''); }}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <div className="library-count">{items.length} habitos encontrados</div>

      <div className="library-grid">
        {items.map((item) => (
          <div key={item.id} className="card library-card" onClick={() => setDetail(item)}>
            <div className="lib-header">
              <h3>{item.name}</h3>
              <span className={`evidence-badge ${EVIDENCE_LABELS[item.evidence_type].cls}`}>
                {EVIDENCE_LABELS[item.evidence_type].label}
              </span>
            </div>
            <p className="lib-benefit">{item.benefit}</p>
            <div className="lib-meta">
              <span className={`category-badge cat-${item.category}`}>{item.category}</span>
              <span className={`diff-badge diff-${item.difficulty}`}>{DIFFICULTY_LABELS[item.difficulty]}</span>
              {item.daily_minutes > 0 && <span className="time-badge"><Clock size={12} /> {item.daily_minutes} min</span>}
            </div>
            {item.warning && <div className="lib-warning-hint"><AlertTriangle size={12} /></div>}
          </div>
        ))}
      </div>

      {items.length === 0 && !loading && (
        <div className="card empty-state">
          <BookMarked size={32} />
          <p>No se encontraron habitos con estos filtros.</p>
        </div>
      )}

      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal library-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{detail.name}</h2>
              <button className="btn-icon" onClick={() => setDetail(null)}><X size={20} /></button>
            </div>

            <div className="detail-badges">
              <span className={`evidence-badge ${EVIDENCE_LABELS[detail.evidence_type].cls}`}>
                {EVIDENCE_LABELS[detail.evidence_type].label}
              </span>
              <span className={`category-badge cat-${detail.category}`}>{detail.category}</span>
              <span className={`diff-badge diff-${detail.difficulty}`}>{DIFFICULTY_LABELS[detail.difficulty]}</span>
              {detail.daily_minutes > 0 && <span className="time-badge"><Clock size={12} /> {detail.daily_minutes} min/dia</span>}
            </div>

            <div className="detail-section">
              <h4>Descripcion</h4>
              <p>{detail.description}</p>
            </div>

            <div className="detail-section">
              <h4>Beneficio</h4>
              <p>{detail.benefit}</p>
            </div>

            <div className="detail-section">
              <h4>Como empezar</h4>
              <p>{detail.how_to_start}</p>
            </div>

            {detail.source && (
              <div className="detail-section">
                <h4><ExternalLink size={14} /> Fuente / Origen</h4>
                <p className="detail-source">{detail.source}</p>
              </div>
            )}

            {detail.warning && (
              <div className="detail-warning">
                <AlertTriangle size={16} />
                <p>{detail.warning}</p>
              </div>
            )}

            <div className="detail-actions">
              <button className="btn btn-primary" onClick={() => handleCreateHabit(detail)}>
                <Plus size={16} /> Crear habito
              </button>
              <button className="btn btn-secondary" onClick={() => handleCreateExperiment(detail)}>
                <FlaskConical size={16} /> Crear experimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
