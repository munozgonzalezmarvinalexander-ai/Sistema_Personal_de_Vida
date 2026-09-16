/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import api, { AUTH_EXPIRED_EVENT } from '../api/client';
import type { User, TokenResponse } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  sessionError: string | null;
  retrySession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [validationAttempt, setValidationAttempt] = useState(0);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSessionError(null);
  }, []);

  useEffect(() => {
    const validatingToken = token;
    setSessionError(null);
    if (validatingToken) {
      setLoading(true);
      api.get('/auth/me')
        .then((res) => {
          if (localStorage.getItem('token') === validatingToken) setUser(res.data);
        })
        .catch((error) => {
          if (localStorage.getItem('token') !== validatingToken) return;
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          if (status === 401 || status === 403) logout();
          else setSessionError('No se pudo validar la sesion. Conservamos tus datos; revisa la conexion e intenta de nuevo.');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, validationAttempt, logout]);

  useEffect(() => {
    const onExpired = (event: Event) => {
      const expiredToken = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (expiredToken && expiredToken === localStorage.getItem('token')) logout();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await api.post<TokenResponse>('/auth/login', { email, password });
    localStorage.setItem('token', res.data.access_token);
    setSessionError(null);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const res = await api.post<TokenResponse>('/auth/register', {
      email,
      password,
      display_name: displayName,
    });
    localStorage.setItem('token', res.data.access_token);
    setSessionError(null);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, loading, sessionError,
      retrySession: () => setValidationAttempt((attempt) => attempt + 1),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
