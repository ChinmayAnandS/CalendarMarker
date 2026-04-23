import { describe, it, expect } from 'vitest';
import { buildOutlookUrl } from '../../src/export/outlook-url';
import type { ExtractedEvent } from '../../src/shared/types';

const BASE_EVENT: ExtractedEvent = {
  title: 'Project Review',
  startDate: '2025-04-30',
  startTime: '14:00',
  endDate: null,
  endTime: '15:30',
  location: 'https://teams.microsoft.com/l/meetup-join/abc123',
  description: 'Quarterly project review.',
  attendees: [],
  timezone: 'America/New_York',
  isAllDay: false,
  rawSubject: 'Project Review',
  rawBody: '',
  confidence: 'high',
};

describe('buildOutlookUrl', () => {
  it('starts with outlook live calendar compose URL', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    expect(url.startsWith('https://outlook.live.com/calendar/0/deeplink/compose')).toBe(true);
  });

  it('includes subject param equal to event title', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('subject')).toBe('Project Review');
  });

  it('includes startdt param', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('startdt')).toBeTruthy();
  });

  it('includes enddt param', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('enddt')).toBeTruthy();
  });

  it('startdt contains the correct date', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('startdt')).toContain('2025-04-30');
  });

  it('startdt contains the correct time', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('startdt')).toContain('14:00');
  });

  it('includes rru=addevent param', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('rru')).toBe('addevent');
  });

  it('includes location when event has one', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('location')).toContain('teams.microsoft.com');
  });

  it('omits location when event has none', () => {
    const event = { ...BASE_EVENT, location: null };
    const url = buildOutlookUrl(event);
    const params = new URL(url).searchParams;
    expect(params.get('location')).toBeNull();
  });

  it('includes body param', () => {
    const url = buildOutlookUrl(BASE_EVENT);
    const params = new URL(url).searchParams;
    expect(params.get('body')).toBeTruthy();
  });

  it('handles all-day events with date-only startdt', () => {
    const event = { ...BASE_EVENT, isAllDay: true, startTime: null, endTime: null };
    const url = buildOutlookUrl(event);
    const startdt = new URL(url).searchParams.get('startdt')!;
    // All-day: just YYYY-MM-DD
    expect(startdt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
