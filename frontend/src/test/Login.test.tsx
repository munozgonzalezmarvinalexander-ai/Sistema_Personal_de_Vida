import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Login from '../pages/Login';
import { AuthProvider } from '../context/AuthContext';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter>;
}

describe('Login', () => {
  it('renders email and password fields', () => {
    render(<Login />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasena/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<Login />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('renders register link', () => {
    render(<Login />, { wrapper: Wrapper });
    expect(screen.getByText(/registrate/i)).toBeInTheDocument();
  });
});
