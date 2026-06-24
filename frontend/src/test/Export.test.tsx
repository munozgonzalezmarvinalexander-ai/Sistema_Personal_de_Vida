import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Export from '../pages/Export';
import { AuthProvider } from '../context/AuthContext';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter>;
}

describe('Export', () => {
  it('renders export title', () => {
    render(<Export />, { wrapper: Wrapper });
    expect(screen.getByText(/exportar datos/i)).toBeInTheDocument();
  });

  it('renders download buttons', () => {
    render(<Export />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole('button', { name: /descargar/i });
    expect(buttons.length).toBe(4);
  });

  it('renders security warning', () => {
    render(<Export />, { wrapper: Wrapper });
    expect(screen.getByText(/informacion personal/i)).toBeInTheDocument();
  });
});
