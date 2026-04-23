import { describe, it, expect } from 'vitest';
import { parseEmail } from '../../src/parser/index';
import type { EmailData } from '../../src/shared/types';

const STANDUP_EMAIL: EmailData = {
  subject: 'Team standup — Monday 28 April 2025 at 10:00 AM in Conference Room B',
  body: '<p>Hi team,</p><p>Weekly standup on April 28, 2025 at 10:00 AM.</p><p>Location: Conference Room B</p><p>Attendees: alice@example.com, bob@example.com</p>',
  sender: 'manager@example.com',
};

describe('parseEmail (integration)', () => {
  it('returns a structured ExtractedEvent', () => {
    const event = parseEmail(STANDUP_EMAIL);
    expect(event.title).toContain('Team standup');
    expect(event.startDate).toBe('2025-04-28');
    expect(event.startTime).toBe('10:00');
    expect(event.location).toBe('Conference Room B');
    expect(event.attendees).toContain('alice@example.com');
    expect(event.attendees).toContain('bob@example.com');
    expect(event.confidence).toBe('high');
    expect(event.rawSubject).toBe(STANDUP_EMAIL.subject);
    expect(event.rawBody).toBe(STANDUP_EMAIL.body);
  });

  it('sets isAllDay false when time is found', () => {
    const event = parseEmail(STANDUP_EMAIL);
    expect(event.isAllDay).toBe(false);
  });

  it('returns medium confidence when only date found', () => {
    const email: EmailData = {
      subject: 'Meeting on April 30, 2025',
      body: 'Come join us for a meeting.',
      sender: null,
    };
    const event = parseEmail(email);
    expect(event.confidence).toBe('medium');
  });

  it('returns low confidence when no date found', () => {
    const email: EmailData = {
      subject: 'Hello there',
      body: 'How are you doing?',
      sender: null,
    };
    const event = parseEmail(email);
    expect(event.confidence).toBe('low');
  });

  it('falls back to body first line for title when subject empty', () => {
    const email: EmailData = {
      subject: '',
      body: '<p>Welcome to the quarterly review</p>',
      sender: null,
    };
    const event = parseEmail(email);
    expect(event.title).toContain('Welcome');
  });

  it('strips HTML from description', () => {
    const event = parseEmail(STANDUP_EMAIL);
    expect(event.description).not.toContain('<p>');
    expect(event.description).not.toContain('</p>');
  });

  it('caps description at 1000 chars', () => {
    const email: EmailData = {
      subject: 'Long email',
      body: 'A'.repeat(2000),
      sender: null,
    };
    const event = parseEmail(email);
    expect(event.description.length).toBeLessThanOrEqual(1000);
  });
});
