import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass, CalendarCheck, ListChecks, BarChart3, TrendingUp,
  FlaskConical, BookMarked, Award, Bell, Download, Lightbulb, LogOut, MoreHorizontal, X
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <Compass size={28} />
          <span>Rumbo</span>
        </div>
        <div className="sidebar-links">
          <NavLink to="/" end><CalendarCheck size={20} /> Hoy</NavLink>
          <NavLink to="/habits"><ListChecks size={20} /> Habitos</NavLink>
          <NavLink to="/trends"><TrendingUp size={20} /> Progreso</NavLink>
          <NavLink to="/experiments"><FlaskConical size={20} /> Experimentos</NavLink>
          <NavLink to="/library"><BookMarked size={20} /> Biblioteca</NavLink>
          <NavLink to="/achievements"><Award size={20} /> Logros</NavLink>
          <NavLink to="/reminders"><Bell size={20} /> Recordatorios</NavLink>
          <NavLink to="/insights"><Lightbulb size={20} /> Sugerencias</NavLink>
          <NavLink to="/export"><Download size={20} /> Exportar</NavLink>
          <NavLink to="/report"><BarChart3 size={20} /> Reporte</NavLink>
        </div>
        <div className="sidebar-footer">
          <span className="user-name">{user?.display_name}</span>
          <button className="btn-icon" onClick={handleLogout} title="Cerrar sesion">
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      {moreOpen && (
        <div className="mobile-more-overlay" onClick={() => setMoreOpen(false)}>
          <nav className="mobile-more-menu" aria-label="Mas opciones" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-more-header"><strong>Mas opciones</strong><button className="btn-icon" onClick={() => setMoreOpen(false)} aria-label="Cerrar"><X size={20} /></button></div>
            <NavLink to="/trends" onClick={() => setMoreOpen(false)}><TrendingUp size={20} /> Progreso</NavLink>
            <NavLink to="/experiments" onClick={() => setMoreOpen(false)}><FlaskConical size={20} /> Experimentos</NavLink>
            <NavLink to="/library" onClick={() => setMoreOpen(false)}><BookMarked size={20} /> Biblioteca</NavLink>
            <NavLink to="/reminders" onClick={() => setMoreOpen(false)}><Bell size={20} /> Recordatorios</NavLink>
            <NavLink to="/insights" onClick={() => setMoreOpen(false)}><Lightbulb size={20} /> Sugerencias</NavLink>
            <NavLink to="/export" onClick={() => setMoreOpen(false)}><Download size={20} /> Exportar datos</NavLink>
            <button className="mobile-logout" onClick={handleLogout}><LogOut size={20} /> Cerrar sesion</button>
          </nav>
        </div>
      )}
      <nav className="bottom-nav">
        <NavLink to="/" end><CalendarCheck size={18} /><span>Hoy</span></NavLink>
        <NavLink to="/habits"><ListChecks size={18} /><span>Habitos</span></NavLink>
        <NavLink to="/achievements"><Award size={18} /><span>Logros</span></NavLink>
        <NavLink to="/report"><BarChart3 size={18} /><span>Reporte</span></NavLink>
        <button className={moreOpen ? 'active' : ''} onClick={() => setMoreOpen((open) => !open)}><MoreHorizontal size={18} /><span>Mas</span></button>
      </nav>
    </div>
  );
}
