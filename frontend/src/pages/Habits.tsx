import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api/client';
import type { Habit, HabitCreate } from '../api/types';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, X, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['salud', 'aprendizaje', 'desarrollo', 'bienestar', 'otro'];

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<HabitCreate>({
    name: '', category: 'salud', level_min: '', level_normal: '', level_ideal: '', is_core: false,
  });

  const loadHabits = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/habits');
      setHabits(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHabits(); }, []);

  const resetForm = () => {
    setForm({ name: '', category: 'salud', level_min: '', level_normal: '', level_ideal: '', is_core: false });
    setEditing(null);
    setShowForm(false);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return; }
    if (!form.level_min.trim()) { setFormError('El nivel minimo es requerido'); return; }
    if (!form.level_normal.trim()) { setFormError('El nivel normal es requerido'); return; }
    if (!form.level_ideal.trim()) { setFormError('El nivel ideal es requerido'); return; }
    try {
      if (editing) {
        await api.put(`/habits/${editing.id}`, form);
      } else {
        await api.post('/habits', form);
      }
      resetForm();
      loadHabits();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const handleEdit = (habit: Habit) => {
    setForm({
      name: habit.name,
      category: habit.category,
      level_min: habit.level_min,
      level_normal: habit.level_normal,
      level_ideal: habit.level_ideal,
      is_core: habit.is_core,
    });
    setEditing(habit);
    setShowForm(true);
    setFormError('');
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/habits/${id}/toggle`);
      loadHabits();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este habito? Se perderan sus registros.')) return;
    try {
      await api.delete(`/habits/${id}`);
      loadHabits();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const activeCount = habits.filter((h) => h.active).length;

  if (loading) {
    return (
      <div className="habits-page">
        <div className="loading-state"><Loader2 size={28} className="spin" /> Cargando habitos...</div>
      </div>
    );
  }

  return (
    <div className="habits-page">
      <header className="page-header">
        <div>
          <h1>Mis Habitos</h1>
          <p className="page-subtitle">{activeCount} activos de {habits.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Nuevo
        </button>
      </header>

      {error && (
        <div className="error-msg">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar habito' : 'Nuevo habito'}</h2>
              <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              {formError && <div className="error-msg">{formError}</div>}
              <div className="form-group">
                <label>Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Sueno" />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nivel minimo</label>
                <input value={form.level_min} onChange={(e) => setForm({ ...form, level_min: e.target.value })} required placeholder="Lo mas facil que puedes hacer" />
              </div>
              <div className="form-group">
                <label>Nivel normal</label>
                <input value={form.level_normal} onChange={(e) => setForm({ ...form, level_normal: e.target.value })} required placeholder="Lo estandar" />
              </div>
              <div className="form-group">
                <label>Nivel ideal</label>
                <input value={form.level_ideal} onChange={(e) => setForm({ ...form, level_ideal: e.target.value })} required placeholder="Tu mejor version" />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={form.is_core} onChange={(e) => setForm({ ...form, is_core: e.target.checked })} />
                  Habito core (cuenta para puntos principales)
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="habits-grid">
        {habits.map((habit) => (
          <div key={habit.id} className={`card habit-manage-card ${!habit.active ? 'inactive' : ''}`}>
            <div className="habit-manage-header">
              <div>
                <h3>
                  {habit.is_core && <Star size={14} className="core-star" />}
                  {habit.name}
                </h3>
                <span className={`category-badge cat-${habit.category}`}>{habit.category}</span>
              </div>
              <div className="habit-actions">
                <button className="btn-icon" onClick={() => handleToggle(habit.id)} title={habit.active ? 'Desactivar' : 'Activar'}>
                  {habit.active ? <ToggleRight size={22} className="toggle-on" /> : <ToggleLeft size={22} />}
                </button>
                <button className="btn-icon" onClick={() => handleEdit(habit)}><Pencil size={16} /></button>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(habit.id)}><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="habit-levels">
              <div className="level"><span className="level-tag level-min">Minima</span> {habit.level_min}</div>
              <div className="level"><span className="level-tag level-normal">Normal</span> {habit.level_normal}</div>
              <div className="level"><span className="level-tag level-ideal">Ideal</span> {habit.level_ideal}</div>
            </div>
          </div>
        ))}
        {habits.length === 0 && (
          <div className="card empty-state">
            <p>No tienes habitos. Crea el primero con el boton Nuevo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
