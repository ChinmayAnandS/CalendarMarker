import { describe, it, expect } from 'vitest';
import { buildGoogleCalendarUrl } from '../../src/export/google-url';
import type { ExtractedEvent } from '../../src/shared/types';

const BASE_EVENT: ExtractedEvent = {
  title: 'Team Standup',
  startDate: '2025-04-28',
  startTime: '10:00',
  endDate: null,
  endTime: '11:00',
  location: 'Conference Room B',
  description: 'Weekly standup.',
  attendees: [],
  timezone: 'Asia/Kolkata',
  isAllDay: false,
  rawSubject: 'Team Standup',
  rawBody: '',
  confidence: 'high',
};

describe('buildGoogleCalendarUrl', () => {
  it('starts with google calendar eventedit base URL', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    expect(url.startsWith('https://calendar.google.com/calendar/r/eventedit')).toBe(true);
  });

  it('includes "text" param equal to event title', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('text')).toBe('Team Standup');
  });

  it('includes "dates" param that is non-empty', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    const dates = params.get('dates');
    expect(dates).toBeTruthy();
    expect(dates).toContain('/');
  });

  it('dates param contains start date', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('dates')).toContain('20250428');
  });

  it('includes ctz param', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('ctz')).toBe('Asia/Kolkata');
  });

  it('includes location when event has one', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('location')).toBe('Conference Room B');
  });

  it('omits location param when event has no location', () => {
    const event = { ...BASE_EVENT, location: null };
    const url = buildGoogleCalendarUrl(event);
    const params = new URL(url).searchParams;
    expect(params.get('location')).toBeNull();
  });

  it('handles all-day events with date-only format in dates param', () => {
    const event = { ...BASE_EVENT, isAllDay: true, startTime: null, endTime: null };
    const url = buildGoogleCalendarUrl(event);
    const dates = new URL(url).searchParams.get('dates')!;
    // All-day dates should be YYYYMMDD (no T)
    expect(dates.includes('T')).toBe(false);
  });

  it('adds default +1hr end time when no end specified', () => {
    const event = { ...BASE_EVENT, endTime: null };
    const url = buildGoogleCalendarUrl(event);
    const dates = new URL(url).searchParams.get('dates')!;
    const [, end] = dates.split('/');
    // Start at 10:00, end should be 11:00 = 110000
    expect(end).toContain('110000');
  });

  it('includes details param', () => {
    const url = buildGoogleCalendarUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('details')).toBeTruthy();
  });
});
