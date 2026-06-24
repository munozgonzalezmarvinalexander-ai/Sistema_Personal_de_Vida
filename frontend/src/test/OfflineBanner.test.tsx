import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OfflineBanner from '../components/OfflineBanner';

describe('OfflineBanner', () => {
  it('does not render when online', () => {
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });
});
