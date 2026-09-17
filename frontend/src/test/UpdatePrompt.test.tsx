import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UpdatePrompt from '../components/UpdatePrompt';
import { setUnsavedChanges } from '../utils/dirtyState';

const { updateServiceWorker } = vi.hoisted(() => ({ updateServiceWorker: vi.fn() }));

vi.mock('../utils/pwaUpdate', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, vi.fn()],
    updateServiceWorker,
  }),
}));

describe('UpdatePrompt', () => {
  beforeEach(() => {
    updateServiceWorker.mockReset();
    setUnsavedChanges(false);
  });

  it('offers update now or later', () => {
    render(<UpdatePrompt />);
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Después' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('blocks reload while there are unsaved changes', () => {
    setUnsavedChanges(true);
    render(<UpdatePrompt />);
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeDisabled();
    expect(screen.getByText(/Guarda o descarta tus cambios/)).toBeInTheDocument();
  });
});
