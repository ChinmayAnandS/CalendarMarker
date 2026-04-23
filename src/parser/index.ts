import type { EmailData, ExtractedEvent } from '../shared/types';
import { normalizeText } from './normalizer';
import { parseDates } from './date-parser';
import { parseLocation } from './location-parser';
import { parseAttendees } from './attendee-parser';

/**
 * Parses raw email data into a structured ExtractedEvent using offline heuristics.
 * No network calls are made.
 */
export function parseEmail(email: EmailData): ExtractedEvent {
  const body = normalizeText(email.body);
  const fullText = `${email.subject}\n${body}`;

  const dates = parseDates(fullText, email.subject);
  const location = parseLocation(body);
  const attendees = parseAttendees(fullText);

  const title =
    email.subject.trim() ||
    body.split('\n').find((l) => l.trim().length > 3) ||
    'Untitled Event';

  const confidence: 'high' | 'medium' | 'low' = dates.startDate
    ? dates.startTime
      ? 'high'
      : 'medium'
    : 'low';

  return {
    title,
    startDate: dates.startDate || new Date().toISOString().slice(0, 10),
    startTime: dates.startTime,
    endDate: dates.endDate,
    endTime: dates.endTime,
    location,
    description: body.slice(0, 1000),
    attendees,
    timezone: dates.timezone,
    isAllDay: dates.isAllDay,
    rawSubject: email.subject,
    rawBody: email.body,
    confidence,
  };
}
