import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Today from './pages/Today';
import Habits from './pages/Habits';
import WeeklyReport from './pages/WeeklyReport';
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
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Today />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/report" element={<WeeklyReport />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
