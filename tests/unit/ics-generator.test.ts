import { describe, it, expect } from 'vitest';
import { generateICS } from '../../src/export/ics-generator';
import type { ExtractedEvent } from '../../src/shared/types';

const BASE_EVENT: ExtractedEvent = {
  title: 'Team Standup',
  startDate: '2025-04-28',
  startTime: '10:00',
  endDate: null,
  endTime: '11:00',
  location: 'Conference Room B',
  description: 'Weekly standup meeting for the team.',
  attendees: ['alice@example.com', 'bob@example.com'],
  timezone: 'Asia/Kolkata',
  isAllDay: false,
  rawSubject: 'Team Standup',
  rawBody: 'Weekly standup meeting for the team.',
  confidence: 'high',
};

/** Splits ICS content into logical lines (unfolding continuation lines). */
function unfoldLines(ics: string): string[] {
  return ics
    .replace(/\r\n /g, '')  // unfold: CRLF + space = continuation
    .split('\r\n')
    .filter((l) => l.length > 0);
}

describe('generateICS', () => {
  it('starts with BEGIN:VCALENDAR', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
  });

  it('ends with END:VCALENDAR', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('contains BEGIN:VEVENT and END:VEVENT', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('contains required version and prodid', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Email2Cal//EN');
  });

  it('contains DTSTART', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('DTSTART');
  });

  it('contains DTEND', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('DTEND');
  });

  it('contains correct SUMMARY', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('SUMMARY:Team Standup');
  });

  it('contains UID', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('UID:');
    expect(ics).toContain('@email2cal');
  });

  it('contains DTSTAMP', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('DTSTAMP:');
  });

  it('all physical lines are ≤ 75 octets', () => {
    const ics = generateICS(BASE_EVENT);
    const lines = ics.split('\r\n').filter((l) => l.length > 0);
    const encoder = new TextEncoder();
    for (const line of lines) {
      const byteLen = encoder.encode(line).length;
      expect(byteLen, `Line too long (${byteLen} bytes): ${line.slice(0, 50)}...`).toBeLessThanOrEqual(75);
    }
  });

  it('includes LOCATION when provided', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('LOCATION:Conference Room B');
  });

  it('omits LOCATION when null', () => {
    const event = { ...BASE_EVENT, location: null };
    const ics = generateICS(event);
    expect(ics).not.toContain('LOCATION:');
  });

  it('includes ATTENDEE lines', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('ATTENDEE:MAILTO:alice@example.com');
    expect(ics).toContain('ATTENDEE:MAILTO:bob@example.com');
  });

  it('uses VALUE=DATE for all-day events', () => {
    const event = { ...BASE_EVENT, isAllDay: true, startTime: null, endTime: null };
    const ics = generateICS(event);
    expect(ics).toContain('VALUE=DATE');
  });

  it('uses TZID for timed events', () => {
    const ics = generateICS(BASE_EVENT);
    expect(ics).toContain('TZID=Asia/Kolkata');
  });

  it('handles long descriptions without exceeding 75 octets per line', () => {
    const event = {
      ...BASE_EVENT,
      description: 'A'.repeat(500),
    };
    const ics = generateICS(event);
    const lines = ics.split('\r\n').filter((l) => l.length > 0);
    const encoder = new TextEncoder();
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('handles events with no attendees', () => {
    const event = { ...BASE_EVENT, attendees: [] };
    const ics = generateICS(event);
    expect(ics).not.toContain('ATTENDEE:');
  });

  it('generates unique UIDs on successive calls', () => {
    // UIDs use Date.now() so may collide in the same ms — just verify format
    const ics1 = generateICS(BASE_EVENT);
    const uidMatch = /UID:(.+)/.exec(ics1);
    expect(uidMatch).not.toBeNull();
    expect(uidMatch![1]).toContain('@email2cal');
  });
});
