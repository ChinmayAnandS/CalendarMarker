import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseDates } from '../../src/parser/date-parser';

// Fix "now" to 2025-04-23 (Wednesday) for relative date tests
const FIXED_NOW = new Date('2025-04-23T09:00:00.000Z');

describe('parseDates', () => {
  describe('ISO 8601', () => {
    it('parses ISO 8601 datetime string', () => {
      const result = parseDates('Meeting at 2025-04-28T15:00:00+05:30', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('15:00');
      expect(result.isAllDay).toBe(false);
    });

    it('parses ISO 8601 with UTC Z', () => {
      const result = parseDates('2025-04-28T09:00:00Z', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('09:00');
    });
  });

  describe('Month Day Year with time', () => {
    it('parses "April 28, 2025 at 3:00 PM"', () => {
      const result = parseDates('April 28, 2025 at 3:00 PM', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('15:00');
      expect(result.isAllDay).toBe(false);
    });

    it('parses "April 28, 2025 at 3:00 PM - 4:30 PM"', () => {
      const result = parseDates('April 28, 2025 at 3:00 PM - 4:30 PM', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('15:00');
      expect(result.endTime).toBe('16:30');
    });

    it('parses "28 April 2025 at 10:00 AM"', () => {
      const result = parseDates('28 April 2025 at 10:00 AM', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('10:00');
    });
  });

  describe('Slash date format', () => {
    it('parses "28/04/2025 15:00 - 16:30"', () => {
      const result = parseDates('28/04/2025 15:00 - 16:30', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('15:00');
      expect(result.endTime).toBe('16:30');
    });

    it('parses "04/28/2025 3:00 PM" (US format when second part > 12)', () => {
      const result = parseDates('04/28/2025 3:00 PM', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('15:00');
    });
  });

  describe('Day Month Year with time', () => {
    it('parses "Monday, 28 April 2025, 3:00 PM – 4:30 PM IST"', () => {
      const result = parseDates('Monday, 28 April 2025, 3:00 PM – 4:30 PM IST', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('15:00');
      expect(result.endTime).toBe('16:30');
      expect(result.timezone).toBe('Asia/Kolkata');
    });
  });

  describe('Bare dates (no time)', () => {
    it('marks all-day when no time found', () => {
      const result = parseDates('Meeting on April 28, 2025', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBeNull();
      expect(result.isAllDay).toBe(true);
    });

    it('parses "28 April 2025" bare date', () => {
      const result = parseDates('28 April 2025', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
    });
  });

  describe('all-day keyword', () => {
    it('detects "all day" keyword → isAllDay: true', () => {
      const result = parseDates('Team offsite all day on April 30, 2025', '', FIXED_NOW);
      expect(result.isAllDay).toBe(true);
    });

    it('detects "all-day" hyphenated → isAllDay: true', () => {
      const result = parseDates('All-day event April 30 2025', '', FIXED_NOW);
      expect(result.isAllDay).toBe(true);
    });
  });

  describe('Relative dates', () => {
    it('resolves "tomorrow at 9am"', () => {
      const result = parseDates('Meeting tomorrow at 9am', '', FIXED_NOW);
      // 2025-04-23 + 1 = 2025-04-24
      expect(result.startDate).toBe('2025-04-24');
      expect(result.startTime).toBe('09:00');
    });

    it('resolves "next Monday"', () => {
      // 2025-04-23 is Wednesday; next Monday = 2025-04-28
      const result = parseDates('Let us meet next Monday', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
    });

    it('resolves "this Friday"', () => {
      // 2025-04-23 is Wednesday; this Friday = 2025-04-25
      const result = parseDates('Let us meet this Friday', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-25');
    });
  });

  describe('Timezone detection', () => {
    it('detects IST → Asia/Kolkata', () => {
      const result = parseDates('3:00 PM IST', '', FIXED_NOW);
      expect(result.timezone).toBe('Asia/Kolkata');
    });

    it('detects PST → America/Los_Angeles', () => {
      const result = parseDates('9:00 AM PST', '', FIXED_NOW);
      expect(result.timezone).toBe('America/Los_Angeles');
    });

    it('detects JST → Asia/Tokyo', () => {
      const result = parseDates('2:00 PM JST', '', FIXED_NOW);
      expect(result.timezone).toBe('Asia/Tokyo');
    });
  });

  describe('No date found', () => {
    it('returns empty startDate gracefully', () => {
      const result = parseDates('Hello, how are you?', '', FIXED_NOW);
      expect(result.startDate).toBe('');
      expect(result.startTime).toBeNull();
      expect(result.endDate).toBeNull();
    });
  });

  describe('24-hour time', () => {
    it('parses 24h time correctly', () => {
      const result = parseDates('Meeting on 2025-04-28 at 14:30', '', FIXED_NOW);
      expect(result.startDate).toBe('2025-04-28');
      expect(result.startTime).toBe('14:30');
    });
  });
});
