import axios from 'axios';

export const AUTH_EXPIRED_EVENT = 'rumbo:auth-expired';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    (config as typeof config & { _authToken?: string })._authToken = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestToken = (err.config as (typeof err.config & { _authToken?: string }) | undefined)?._authToken;
    if (
      err.response?.status === 401
      && !err.config?.url?.includes('/auth/')
      && requestToken
      && requestToken === localStorage.getItem('token')
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT, { detail: { token: requestToken } }));
    }
    return Promise.reject(err);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'No se pudo conectar con el servidor';
    const detail = err.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
    if (err.response.status === 422) return 'Datos invalidos';
    if (err.response.status === 401) return 'Sesion expirada';
    return 'Error del servidor';
  }
  return 'Error inesperado';
}

export default api;
