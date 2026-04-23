import { describe, it, expect } from 'vitest';
import { parseAttendees } from '../../src/parser/attendee-parser';

describe('parseAttendees', () => {
  it('extracts a single email address', () => {
    const result = parseAttendees('Please contact alice@example.com for details.');
    expect(result).toContain('alice@example.com');
  });

  it('extracts multiple email addresses', () => {
    const text = 'Attendees: alice@example.com, bob@company.org, carol@mail.net';
    const result = parseAttendees(text);
    expect(result).toContain('alice@example.com');
    expect(result).toContain('bob@company.org');
    expect(result).toContain('carol@mail.net');
  });

  it('deduplicates email addresses', () => {
    const text = 'From: alice@example.com\nTo: alice@example.com, bob@example.com';
    const result = parseAttendees(text);
    const aliceCount = result.filter((a) => a === 'alice@example.com').length;
    expect(aliceCount).toBe(1);
  });

  it('lowercases all addresses', () => {
    const text = 'RSVP to ALICE@EXAMPLE.COM';
    const result = parseAttendees(text);
    expect(result).toContain('alice@example.com');
    expect(result).not.toContain('ALICE@EXAMPLE.COM');
  });

  it('handles addresses with plus signs', () => {
    const text = 'CC: alice+test@example.com';
    const result = parseAttendees(text);
    expect(result).toContain('alice+test@example.com');
  });

  it('handles addresses with subdomains', () => {
    const text = 'user@mail.company.co.uk registered';
    const result = parseAttendees(text);
    expect(result).toContain('user@mail.company.co.uk');
  });

  it('returns empty array when no emails found', () => {
    const result = parseAttendees('No email addresses here at all.');
    expect(result).toEqual([]);
  });

  it('caps result at 20 attendees', () => {
    const emails = Array.from({ length: 30 }, (_, i) => `user${i}@example.com`).join(' ');
    const result = parseAttendees(emails);
    expect(result.length).toBeLessThanOrEqual(20);
  });
});
