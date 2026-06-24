import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, CalendarCheck, ListChecks, BarChart3, LogOut } from 'lucide-react';

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
          <NavLink to="/habits"><ListChecks size={20} /> Hábitos</NavLink>
          <NavLink to="/report"><BarChart3 size={20} /> Reporte</NavLink>
        </div>
        <div className="sidebar-footer">
          <span className="user-name">{user?.display_name}</span>
          <button className="btn-icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <NavLink to="/" end><CalendarCheck size={20} /><span>Hoy</span></NavLink>
        <NavLink to="/habits"><ListChecks size={20} /><span>Hábitos</span></NavLink>
        <NavLink to="/report"><BarChart3 size={20} /><span>Reporte</span></NavLink>
        <button onClick={handleLogout}><LogOut size={20} /><span>Salir</span></button>
      </nav>
    </div>
  );
}
