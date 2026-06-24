import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Register from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter>;
}

describe('Register', () => {
  it('renders name, email, and password fields', () => {
    render(<Register />, { wrapper: Wrapper });
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasena/i)).toBeInTheDocument();
  });

  it('renders create account button', () => {
    render(<Register />, { wrapper: Wrapper });
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();
  });
});
