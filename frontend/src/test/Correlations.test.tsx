import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import api from '../api/client';
import Insights from '../pages/Insights';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter><AuthProvider>{children}</AuthProvider></BrowserRouter>;
}

let corrResponse = {
  days: 30, sample_size: 3, correlations: [] as unknown[],
  message: 'Necesitas al menos 7 dias con datos para detectar patrones confiables.',
  lag_days: 0,
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

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  ScatterChart: ({ children }: { children: React.ReactNode }) => <div data-testid="scatter-chart">{children}</div>,
  Scatter: () => <div data-testid="scatter" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe('Correlations section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    corrResponse = {
      days: 30, sample_size: 3, correlations: [],
      message: 'Necesitas al menos 7 dias con datos para detectar patrones confiables.',
      lag_days: 0,
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
      days: 30, sample_size: 15, lag_days: 0,
      correlations: [
        {
          id: 'c1', metric_x: 'sleep_hours', metric_y: 'energy',
          label_x: 'Horas de sueno', label_y: 'Energia',
          coefficient: 0.82, strength: 'strong', direction: 'positive',
          sample_size: 15, message: 'Tu energia suele ser mas alta los dias que duermes mas.',
          recommendation: 'Observa si dormir mas de 7 horas mejora tu energia.',
          confidence: 'medium', lag_days: 0,
          data_points: [
            { date: '2026-06-01', x: 7, y: 4 },
            { date: '2026-06-02', x: 8, y: 5 },
          ],
        },
        {
          id: 'c2', metric_x: 'screen_hours', metric_y: 'mood',
          label_x: 'Horas de pantalla', label_y: 'Animo',
          coefficient: -0.65, strength: 'moderate', direction: 'negative',
          sample_size: 15, message: 'Tu animo parece bajar los dias con mas pantalla.',
          recommendation: 'Reducir pantalla podria mejorar tu animo.',
          confidence: 'medium', lag_days: 0,
          data_points: [
            { date: '2026-06-01', x: 3, y: 4 },
            { date: '2026-06-02', x: 5, y: 2 },
          ],
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

  // ── New lag tests ──

  it('shows lag selector', async () => {
    render(<Insights />, { wrapper: Wrapper });
    const lagSelect = await screen.findByTestId('lag-selector');
    expect(lagSelect).toBeInTheDocument();
    expect(screen.getByText('Mismo dia')).toBeInTheDocument();
  });

  it('switches between same day and previous day', async () => {
    render(<Insights />, { wrapper: Wrapper });
    const lagSelect = await screen.findByTestId('lag-selector');

    fireEvent.change(lagSelect, { target: { value: '1' } });

    await waitFor(() => {
      const calls = vi.mocked(api.get).mock.calls.filter(
        (c) => typeof c[0] === 'string' && c[0].includes('lag=1')
      );
      expect(calls.length).toBeGreaterThan(0);
    });
  });

  it('shows insufficient data hint for lag=1', async () => {
    corrResponse = {
      days: 30, sample_size: 3, correlations: [],
      message: 'Necesitas mas registros consecutivos para analizar patrones con retardo.',
      lag_days: 1,
    };

    render(<Insights />, { wrapper: Wrapper });
    const lagSelect = await screen.findByTestId('lag-selector');
    fireEvent.change(lagSelect, { target: { value: '1' } });

    corrResponse = {
      days: 30, sample_size: 3, correlations: [],
      message: 'Necesitas mas registros consecutivos para analizar patrones con retardo.',
      lag_days: 1,
    };

    const hint = await screen.findByTestId('lag-insufficient');
    expect(hint).toBeInTheDocument();
    expect(hint.textContent).toContain('registros consecutivos');
  });

  it('renders scatter plot in correlation card', async () => {
    corrResponse = {
      days: 30, sample_size: 15, lag_days: 0,
      correlations: [
        {
          id: 'c1', metric_x: 'sleep_hours', metric_y: 'energy',
          label_x: 'Horas de sueno', label_y: 'Energia',
          coefficient: 0.82, strength: 'strong', direction: 'positive',
          sample_size: 15, message: 'Test message.',
          recommendation: 'Test rec.',
          confidence: 'medium', lag_days: 0,
          data_points: [
            { date: '2026-06-01', x: 7, y: 4 },
            { date: '2026-06-02', x: 8, y: 5 },
            { date: '2026-06-03', x: 6, y: 3 },
          ],
        },
      ],
      message: 'Se encontraron 1 patrones.',
    };

    render(<Insights />, { wrapper: Wrapper });
    const plots = await screen.findAllByTestId('scatter-plot');
    expect(plots).toHaveLength(1);
  });

  it('shows lag badge for lag=1 correlations', async () => {
    corrResponse = {
      days: 30, sample_size: 15, lag_days: 1,
      correlations: [
        {
          id: 'c1', metric_x: 'sleep_hours', metric_y: 'energy',
          label_x: 'Horas de sueno', label_y: 'Energia',
          coefficient: 0.75, strength: 'strong', direction: 'positive',
          sample_size: 11, message: 'Test lag message.',
          recommendation: 'Test lag rec.',
          confidence: 'medium', lag_days: 1,
          data_points: [
            { date: '2026-06-01', x: 7, y: 4 },
            { date: '2026-06-02', x: 8, y: 5 },
          ],
        },
      ],
      message: 'Se encontraron 1 patrones (comparando el dia anterior con el dia siguiente).',
    };

    render(<Insights />, { wrapper: Wrapper });
    const badges = await screen.findAllByTestId('lag-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0].textContent).toContain('Retardo');
  });
});
