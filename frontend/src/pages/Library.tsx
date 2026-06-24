import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import type { HabitLibraryItem, EvidenceType, DifficultyLevel, Habit, Experiment } from '../api/types';
import {
  Search, BookMarked, X, Clock, AlertTriangle, ExternalLink, Info,
  Plus, FlaskConical, AlertCircle, Loader2, Filter, CheckCircle
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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [evFilter, setEvFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

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

  const handleCreateHabit = async (item: HabitLibraryItem) => {
    try {
      const habitsRes = await api.get<Habit[]>('/habits');
      const exists = habitsRes.data.some(
        (h) => h.name.toLowerCase() === item.name.toLowerCase()
      );
      if (exists) {
        showToast('error', `Ya tienes un habito llamado "${item.name}"`);
        return;
      }
      const mins = item.daily_minutes || 5;
      await api.post('/habits', {
        name: item.name,
        category: item.category,
        level_min: `${Math.max(1, Math.round(mins * 0.3))} min - version minima`,
        level_normal: `${mins} min - practica estandar`,
        level_ideal: `${Math.round(mins * 1.5)} min - version completa`,
        is_core: false,
      });
      showToast('success', `Habito "${item.name}" creado`);
      setDetail(null);
      setTimeout(() => navigate('/habits'), 1500);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleCreateExperiment = async (item: HabitLibraryItem) => {
    try {
      const expsRes = await api.get<Experiment[]>('/experiments');
      const activedup = expsRes.data.some(
        (e) => e.status === 'active' && e.title.toLowerCase() === item.name.toLowerCase()
      );
      if (activedup) {
        showToast('error', `Ya tienes un experimento activo con ese titulo`);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const firstBenefit = item.benefit.split(',')[0].toLowerCase().trim();
      await api.post('/experiments', {
        title: item.name,
        description: item.description,
        hypothesis: `Creo que practicar "${item.name.toLowerCase()}" puede mejorar mi ${firstBenefit}`,
        metric_tracked: item.benefit.split(',')[0].trim(),
        duration_days: 14,
        start_date: today,
      });
      showToast('success', `Experimento "${item.name}" creado (14 dias)`);
      setDetail(null);
      setTimeout(() => navigate('/experiments'), 1500);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const activeFilters = [catFilter, evFilter, diffFilter].filter(Boolean).length;

  if (loading && items.length === 0) {
    return <div className="library-page"><div className="loading-state"><Loader2 size={28} className="spin" /> Cargando biblioteca...</div></div>;
  }

  return (
    <div className="library-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <header className="page-header">
        <div>
          <h1>Biblioteca</h1>
          <p className="page-subtitle">Habitos investigados y clasificados por tipo de evidencia</p>
        </div>
      </header>

      <div className="card evidence-disclaimer">
        <Info size={18} />
        <p>Las etiquetas de evidencia indican el tipo de respaldo de cada practica. <strong>Ciencia</strong> tiene estudios publicados, <strong>tradicion</strong> viene de culturas o filosofias, y <strong>personal</strong> es experiencia practica comun. No todas las practicas tienen el mismo nivel de evidencia.</p>
      </div>

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
                <FlaskConical size={16} /> Crear experimento (14d)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
