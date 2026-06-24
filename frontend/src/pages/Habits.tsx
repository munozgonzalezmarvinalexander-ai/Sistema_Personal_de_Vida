import { useState, useEffect } from 'react';
import api from '../api/client';
import type { Habit, HabitCreate } from '../api/types';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Star, X } from 'lucide-react';

const CATEGORIES = ['salud', 'aprendizaje', 'desarrollo', 'bienestar', 'otro'];

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [form, setForm] = useState<HabitCreate>({
    name: '', category: 'salud', level_min: '', level_normal: '', level_ideal: '', is_core: false,
  });

  const loadHabits = async () => {
    const res = await api.get('/habits');
    setHabits(res.data);
  };

  useEffect(() => { loadHabits(); }, []);

  const resetForm = () => {
    setForm({ name: '', category: 'salud', level_min: '', level_normal: '', level_ideal: '', is_core: false });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/habits/${editing.id}`, form);
    } else {
      await api.post('/habits', form);
    }
    resetForm();
    loadHabits();
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
  };

  const handleToggle = async (id: string) => {
    await api.patch(`/habits/${id}/toggle`);
    loadHabits();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este hábito? Se perderán sus registros.')) {
      await api.delete(`/habits/${id}`);
      loadHabits();
    }
  };

  return (
    <div className="habits-page">
      <header className="page-header">
        <h1>Mis Hábitos</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Nuevo
        </button>
      </header>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar hábito' : 'Nuevo hábito'}</h2>
              <button className="btn-icon" onClick={resetForm}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Sueño" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Nivel mínimo</label>
                <input value={form.level_min} onChange={(e) => setForm({ ...form, level_min: e.target.value })} required placeholder="Lo más fácil que puedes hacer" />
              </div>
              <div className="form-group">
                <label>Nivel normal</label>
                <input value={form.level_normal} onChange={(e) => setForm({ ...form, level_normal: e.target.value })} required placeholder="Lo estándar" />
              </div>
              <div className="form-group">
                <label>Nivel ideal</label>
                <input value={form.level_ideal} onChange={(e) => setForm({ ...form, level_ideal: e.target.value })} required placeholder="Tu mejor versión" />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={form.is_core} onChange={(e) => setForm({ ...form, is_core: e.target.checked })} />
                  Hábito core (cuenta para puntos principales)
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
              <div className="level"><span className="level-tag level-min">Mínima</span> {habit.level_min}</div>
              <div className="level"><span className="level-tag level-normal">Normal</span> {habit.level_normal}</div>
              <div className="level"><span className="level-tag level-ideal">Ideal</span> {habit.level_ideal}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
