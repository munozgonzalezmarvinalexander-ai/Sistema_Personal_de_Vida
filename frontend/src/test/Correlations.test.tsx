import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Insights from '../pages/Insights';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter>;
}

let corrResponse = {
  days: 30, sample_size: 3, correlations: [] as unknown[],
  message: 'Necesitas al menos 7 dias con datos para detectar patrones confiables.',
};

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/insights') return Promise.resolve({
        data: [{
          id: '1', type: 'low_sleep', title: 'Sueno bajo',
          message: 'Tu promedio fue 5.5h', recommendation: 'Duerme mas',
          category: 'sueno', priority: 'high', confidence: 'medium',
          period_days: 7, related_metric: 'sleep_hours',
          created_from: 'rules', action_label: null, action_target: null,
        }],
      });
      if (url === '/insights/summary') return Promise.resolve({
        data: {
          total: 1, high_priority: 1, medium_priority: 0, low_priority: 0,
          best_metric: null, needs_attention: 'sleep_hours',
          general_message: 'Hay areas que necesitan atencion.',
        },
      });
      if (url.startsWith('/insights/correlations'))
        return Promise.resolve({ data: corrResponse });
      return Promise.reject(new Error('Unknown URL'));
    }),
  },
  getErrorMessage: () => 'Error',
}));

describe('Correlations section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    corrResponse = {
      days: 30, sample_size: 3, correlations: [],
      message: 'Necesitas al menos 7 dias con datos para detectar patrones confiables.',
    };
  });

  it('renders the correlations section', async () => {
    render(<Insights />, { wrapper: Wrapper });
    const section = await screen.findByTestId('correlations-section');
    expect(section).toBeInTheDocument();
    expect(screen.getByText('Patrones detectados')).toBeInTheDocument();
  });

  it('shows empty state for insufficient data', async () => {
    render(<Insights />, { wrapper: Wrapper });
    const empty = await screen.findByTestId('correlations-empty');
    expect(empty).toBeInTheDocument();
  });

  it('shows correlation cards with data', async () => {
    corrResponse = {
      days: 30, sample_size: 15,
      correlations: [
        {
          id: 'c1', metric_x: 'sleep_hours', metric_y: 'energy',
          label_x: 'Horas de sueno', label_y: 'Energia',
          coefficient: 0.82, strength: 'strong', direction: 'positive',
          sample_size: 15, message: 'Tu energia suele ser mas alta los dias que duermes mas.',
          recommendation: 'Observa si dormir mas de 7 horas mejora tu energia.',
          confidence: 'medium',
        },
        {
          id: 'c2', metric_x: 'screen_hours', metric_y: 'mood',
          label_x: 'Horas de pantalla', label_y: 'Animo',
          coefficient: -0.65, strength: 'moderate', direction: 'negative',
          sample_size: 15, message: 'Tu animo parece bajar los dias con mas pantalla.',
          recommendation: 'Reducir pantalla podria mejorar tu animo.',
          confidence: 'medium',
        },
      ],
      message: 'Se encontraron 2 patrones en tus ultimos 30 dias.',
    };

    render(<Insights />, { wrapper: Wrapper });
    const cards = await screen.findAllByTestId('correlation-card');
    expect(cards).toHaveLength(2);

    expect(screen.getByText('Horas de sueno')).toBeInTheDocument();
    expect(screen.getByText('Energia')).toBeInTheDocument();
    expect(screen.getByText('Fuerte')).toBeInTheDocument();

    expect(screen.getByText('Horas de pantalla')).toBeInTheDocument();
    expect(screen.getByText('Animo')).toBeInTheDocument();
    expect(screen.getByText('Moderada')).toBeInTheDocument();
  });

  it('shows day selector with options', async () => {
    render(<Insights />, { wrapper: Wrapper });
    const select = await screen.findByDisplayValue('30 dias');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('14 dias')).toBeInTheDocument();
    expect(screen.getByText('60 dias')).toBeInTheDocument();
    expect(screen.getByText('90 dias')).toBeInTheDocument();
  });
});
