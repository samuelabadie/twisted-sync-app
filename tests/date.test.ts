import { formatDateTimeFR } from '../src/utils/date';

describe('formatDateTimeFR', () => {
  it('formats a winter date with Paris timezone (CET, UTC+1)', () => {
    // January 15, 2025 at 14:30 UTC = 15:30 Paris time (CET = UTC+1)
    const date = new Date('2025-01-15T14:30:00Z');
    const result = formatDateTimeFR(date);

    expect(result).toContain('15');
    expect(result).toContain('janvier');
    expect(result).toContain('2025');
    expect(result).toContain('15:30'); // UTC+1
  });

  it('formats a summer date with Paris timezone (CEST, UTC+2)', () => {
    // July 10, 2025 at 14:00 UTC = 16:00 Paris time (CEST = UTC+2)
    const date = new Date('2025-07-10T14:00:00Z');
    const result = formatDateTimeFR(date);

    expect(result).toContain('10');
    expect(result).toContain('juillet');
    expect(result).toContain('16:00'); // UTC+2
  });

  it('returns French weekday names', () => {
    // Wednesday, January 15, 2025
    const date = new Date('2025-01-15T10:00:00Z');
    const result = formatDateTimeFR(date);

    expect(result).toContain('mercredi');
  });

  it('handles midnight UTC correctly for Paris (becomes next day hour)', () => {
    // Midnight UTC on Jan 15 = 01:00 Paris time (CET)
    const date = new Date('2025-01-15T00:00:00Z');
    const result = formatDateTimeFR(date);

    expect(result).toContain('01:00');
    expect(result).toContain('15'); // Still Jan 15 in Paris
  });

  it('handles late night UTC that crosses day boundary in Paris', () => {
    // 23:30 UTC on Jan 14 = 00:30 Jan 15 Paris time (CET)
    const date = new Date('2025-01-14T23:30:00Z');
    const result = formatDateTimeFR(date);

    expect(result).toContain('00:30');
    expect(result).toContain('15'); // Now Jan 15 in Paris
    expect(result).toContain('janvier');
  });
});
