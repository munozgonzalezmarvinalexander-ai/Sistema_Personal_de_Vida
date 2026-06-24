import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import ReminderChecker from './components/ReminderChecker';
import Login from './pages/Login';
import Register from './pages/Register';
import Today from './pages/Today';
import Habits from './pages/Habits';
import WeeklyReport from './pages/WeeklyReport';
import Trends from './pages/Trends';
import Experiments from './pages/Experiments';
import Library from './pages/Library';
import Achievements from './pages/Achievements';
import Reminders from './pages/Reminders';
import Export from './pages/Export';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (token) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineBanner />
        <InstallPrompt />
        <ReminderChecker />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Today />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/experiments" element={<Experiments />} />
            <Route path="/library" element={<Library />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/export" element={<Export />} />
            <Route path="/report" element={<WeeklyReport />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
