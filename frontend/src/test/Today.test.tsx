import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Today from '../pages/Today';
import api from '../api/client';
import { guatemalaDateString } from '../utils/date';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'draft-user', email: 'draft@example.com', display_name: 'Draft' } }),
}));

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  getErrorMessage: () => 'No se pudo guardar',
}));

const mockedApi = vi.mocked(api);
const draftKey = () => `rumbo_checkin_draft_draft-user_${guatemalaDateString()}`;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('Today draft save lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedApi.get.mockImplementation(async (url: string) => {
      if (url === '/habits' || url === '/habit-logs' || url === '/insights') return { data: [] } as never;
      if (url === '/checkins/today') return { data: null } as never;
      if (url === '/reports/streaks') return { data: null } as never;
      if (url === '/gamification/progress') return { data: null } as never;
      return { data: null } as never;
    });
  });

  it('keeps the draft when saving fails', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('offline'));
    render(<Today />);
    const note = await screen.findByPlaceholderText('Como fue tu dia?');
    fireEvent.change(note, { target: { value: 'no perder' } });
    await waitFor(() => expect(localStorage.getItem(draftKey())).toContain('no perder'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar dia/i }));
    await screen.findByText('No se pudo guardar');
    expect(localStorage.getItem(draftKey())).toContain('no perder');
  });

  it('removes the exact draft after a successful save', async () => {
    mockedApi.post.mockImplementation(async (url: string) => {
      if (url === '/checkins') return { data: { id: 'checkin-1' } } as never;
      if (url === '/gamification/recalculate') return { data: { new_achievements: [] } } as never;
      return { data: null } as never;
    });
    render(<Today />);
    fireEvent.change(await screen.findByPlaceholderText('Como fue tu dia?'), { target: { value: 'guardado' } });
    await waitFor(() => expect(localStorage.getItem(draftKey())).toContain('guardado'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar dia/i }));
    await screen.findByText('Dia guardado correctamente');
    expect(localStorage.getItem(draftKey())).toBeNull();
  });

  it('preserves edits made while the previous snapshot is saving', async () => {
    const pending = deferred<{ data: { id: string } }>();
    mockedApi.post.mockImplementation((url: string) => {
      if (url === '/checkins') return pending.promise as never;
      return Promise.resolve({ data: { new_achievements: [] } }) as never;
    });
    render(<Today />);
    const note = await screen.findByPlaceholderText('Como fue tu dia?');
    fireEvent.change(note, { target: { value: 'version uno' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar dia/i }));
    fireEvent.change(note, { target: { value: 'version dos' } });
    pending.resolve({ data: { id: 'checkin-1' } });
    await screen.findByText('Dia guardado correctamente');
    await waitFor(() => expect(localStorage.getItem(draftKey())).toContain('version dos'));
    expect(note).toHaveValue('version dos');
  });
});
