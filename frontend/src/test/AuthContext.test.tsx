import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('../api/client', () => ({
  default: { get: mockGet, post: vi.fn() },
  AUTH_EXPIRED_EVENT: 'rumbo:auth-expired',
}));

function Probe() {
  const { token, loading, sessionError } = useAuth();
  return <div>{loading ? 'loading' : 'ready'}|{token || 'no-token'}|{sessionError || 'no-error'}</div>;
}

describe('AuthContext session recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGet.mockReset();
  });

  it('keeps the token after a network/server failure', async () => {
    localStorage.setItem('token', 'still-valid');
    mockGet.mockRejectedValue({ isAxiosError: true, response: { status: 503 } });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText(/ready\|still-valid\|No se pudo validar/)).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBe('still-valid');
  });

  it('removes the token only when the server rejects it', async () => {
    localStorage.setItem('token', 'expired');
    mockGet.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText(/ready\|no-token\|no-error/)).toBeInTheDocument());
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('ignores an expiration event for an older token', async () => {
    localStorage.setItem('token', 'new-token');
    mockGet.mockResolvedValue({ data: { id: '1', email: 'a@b.com', display_name: 'A', created_at: '' } });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText(/ready\|new-token/)).toBeInTheDocument());
    window.dispatchEvent(new CustomEvent('rumbo:auth-expired', { detail: { token: 'old-token' } }));
    expect(localStorage.getItem('token')).toBe('new-token');
  });
});
