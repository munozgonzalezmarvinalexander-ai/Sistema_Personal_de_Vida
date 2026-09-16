import { describe, expect, it } from 'vitest';
import { guatemalaDateString, mondayForGuatemala } from '../utils/date';

describe('Guatemala dates', () => {
  it('does not roll over at UTC midnight while Guatemala is on the prior day', () => {
    expect(guatemalaDateString(new Date('2026-09-17T02:30:00Z'))).toBe('2026-09-16');
  });

  it('calculates Monday in the application timezone', () => {
    expect(mondayForGuatemala(new Date('2026-09-20T18:00:00Z'))).toBe('2026-09-14');
  });
});
