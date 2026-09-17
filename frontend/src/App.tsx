import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import ReminderChecker from './components/ReminderChecker';
import UpdatePrompt from './components/UpdatePrompt';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
const Today = lazy(() => import('./pages/Today'));
const Habits = lazy(() => import('./pages/Habits'));
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'));
const Trends = lazy(() => import('./pages/Trends'));
const Experiments = lazy(() => import('./pages/Experiments'));
const Library = lazy(() => import('./pages/Library'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Export = lazy(() => import('./pages/Export'));
const Insights = lazy(() => import('./pages/Insights'));

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading, sessionError, retrySession } = useAuth();
  if (loading) return <div className="loading-screen">Cargando...</div>;
  if (!token) return <Navigate to="/login" />;
  if (sessionError) return <div className="loading-screen recovery-screen"><p>{sessionError}</p><button className="btn btn-primary" onClick={retrySession}>Reintentar</button></div>;
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
        <ErrorBoundary>
          <OfflineBanner />
          <InstallPrompt />
          <UpdatePrompt />
          <ReminderChecker />
          <Suspense fallback={<div className="loading-screen">Cargando pantalla...</div>}>
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
            <Route path="/insights" element={<Insights />} />
            <Route path="/report" element={<WeeklyReport />} />
          </Route>
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
