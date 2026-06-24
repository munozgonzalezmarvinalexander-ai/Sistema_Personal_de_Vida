import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Compass, CalendarCheck, ListChecks, BarChart3, TrendingUp,
  FlaskConical, BookMarked, LogOut
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <nav className="bottom-nav">
        <NavLink to="/" end><CalendarCheck size={18} /><span>Hoy</span></NavLink>
        <NavLink to="/habits"><ListChecks size={18} /><span>Habitos</span></NavLink>
        <NavLink to="/library"><BookMarked size={18} /><span>Biblio</span></NavLink>
        <NavLink to="/trends"><TrendingUp size={18} /><span>Progreso</span></NavLink>
        <NavLink to="/report"><BarChart3 size={18} /><span>Reporte</span></NavLink>
      </nav>
    </div>
  );
}
