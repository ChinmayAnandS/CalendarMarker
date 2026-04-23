import { describe, it, expect } from 'vitest';
import { parseLocation } from '../../src/parser/location-parser';

describe('parseLocation', () => {
  describe('Virtual meeting URLs', () => {
    it('extracts Zoom URL', () => {
      const text = 'Join via https://zoom.us/j/123456789?pwd=abc the meeting';
      expect(parseLocation(text)).toBe('https://zoom.us/j/123456789?pwd=abc');
    });

    it('extracts Google Meet URL', () => {
      const text = 'Meeting link: https://meet.google.com/abc-defg-hij';
      expect(parseLocation(text)).toBe('https://meet.google.com/abc-defg-hij');
    });

    it('extracts Teams URL', () => {
      const text = 'https://teams.microsoft.com/l/meetup-join/19%3abc123';
      expect(parseLocation(text)).toContain('teams.microsoft.com');
    });

    it('extracts Webex URL', () => {
      const text = 'Join at https://webex.com/meet/someroom';
      expect(parseLocation(text)).toContain('webex.com');
    });
  });

  describe('Location keyword lines', () => {
    it('extracts after "Location:" keyword', () => {
      const text = 'Location: Conference Room B, 3rd Floor';
      expect(parseLocation(text)).toBe('Conference Room B, 3rd Floor');
    });

    it('extracts after "Venue:" keyword', () => {
      const text = 'Venue: Grand Hyatt Hotel\nSee you there';
      expect(parseLocation(text)).toBe('Grand Hyatt Hotel');
    });

    it('extracts after "Address:" keyword', () => {
      const text = 'Address: 123 Main St, Springfield';
      expect(parseLocation(text)).toBe('123 Main St, Springfield');
    });

    it('is case-insensitive for keywords', () => {
      const text = 'LOCATION: Rooftop Garden';
      expect(parseLocation(text)).toBe('Rooftop Garden');
    });
  });

  describe('Street address', () => {
    it('extracts a street address', () => {
      const text = 'Please come to 42 Maple Street, Sunnyvale for the event.';
      expect(parseLocation(text)).toContain('42 Maple Street');
    });

    it('handles Indian address format (Nagar)', () => {
      const text = 'We are at 15 Gandhi Nagar for the conference.';
      expect(parseLocation(text)).toContain('Gandhi Nagar');
    });
  });

  describe('No location', () => {
    it('returns null when no location found', () => {
      const text = 'Hi, hope you are doing well. Let me know your thoughts.';
      expect(parseLocation(text)).toBeNull();
    });
  });

  describe('Priority: URL > keyword > address', () => {
    it('URL takes priority over keyword', () => {
      const text = 'Location: Conference Room\nhttps://zoom.us/j/99999';
      const result = parseLocation(text);
      expect(result).toContain('zoom.us');
    });
  });

  describe('Length capping', () => {
    it('caps result at 200 chars', () => {
      const longAddr = 'Location: ' + 'A'.repeat(300);
      const result = parseLocation(longAddr);
      expect(result).not.toBeNull();
      expect(result!.length).toBeLessThanOrEqual(200);
    });
  });
});
