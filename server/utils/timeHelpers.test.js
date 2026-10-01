import { describe, it, expect } from 'vitest';
import { isWithinBusinessHours, getCurrentThaiDateTime } from './timeHelpers.js';

describe('timeHelpers - isWithinBusinessHours', () => {
  const config = {
    start: '08:30',
    end: '18:00',
    workdays: [1, 2, 3, 4, 5], // Mon-Fri
  };

  it('should return true for a time within business hours on a workday', () => {
    // Wednesday 10:00 AM (Thai time)
    const date = new Date('2026-10-07T10:00:00+07:00');
    expect(isWithinBusinessHours(date, config)).toBe(true);
  });

  it('should return false for midnight (00:39 AM) on a workday', () => {
    // Thursday 00:39 AM (Thai time)
    const date = new Date('2026-10-08T00:39:00+07:00');
    expect(isWithinBusinessHours(date, config)).toBe(false);
  });

  it('should return false for after hours (19:30 PM)', () => {
    // Wednesday 19:30 PM (Thai time)
    const date = new Date('2026-10-07T19:30:00+07:00');
    expect(isWithinBusinessHours(date, config)).toBe(false);
  });

  it('should return false on Sunday if Sunday (0) is not in workdays', () => {
    // Sunday 11:00 AM (Thai time)
    const date = new Date('2026-10-04T11:00:00+07:00');
    expect(isWithinBusinessHours(date, config)).toBe(false);
  });

  it('should handle boundary exact start and end times', () => {
    const start = new Date('2026-10-07T08:30:00+07:00');
    const end = new Date('2026-10-07T18:00:00+07:00');
    const afterEnd = new Date('2026-10-07T18:01:00+07:00');

    expect(isWithinBusinessHours(start, config)).toBe(true);
    expect(isWithinBusinessHours(end, config)).toBe(true);
    expect(isWithinBusinessHours(afterEnd, config)).toBe(false);
  });

  it('should return true if no config is provided (always open)', () => {
    expect(isWithinBusinessHours(new Date(), null)).toBe(true);
  });
});
