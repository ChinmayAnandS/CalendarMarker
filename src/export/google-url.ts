import type { ExtractedEvent } from '../shared/types';
import { pad } from '../shared/utils';

const BASE_URL = 'https://calendar.google.com/calendar/r/eventedit';

/**
 * Formats a date (YYYY-MM-DD) + optional time (HH:MM) as Google Calendar date string.
 * All-day: YYYYMMDD. Timed: YYYYMMDDTHHmmSS.
 * @param date - YYYY-MM-DD
 * @param time - HH:MM or null (all-day)
 * @param offsetMinutes - optional minutes to add
 */
function formatGoogleDate(date: string, time: string | null, offsetMinutes = 0): string {
  const [y, mo, d] = date.split('-').map(Number);
  if (!time) {
    // All-day: return YYYYMMDD
    return `${y}${pad(mo)}${pad(d)}`;
  }
  const [h, min] = time.split(':').map(Number);
  const dt = new Date(y, mo - 1, d, h, min + offsetMinutes, 0);
  return (
    `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
  );
}

/**
 * Builds a Google Calendar pre-filled event URL (no OAuth required).
 * Opens calendar.google.com/calendar/r/eventedit with query params.
 */
export function buildGoogleCalendarUrl(event: ExtractedEvent): string {
  const start = formatGoogleDate(event.startDate, event.startTime);
  const end = event.endDate
    ? formatGoogleDate(event.endDate, event.endTime)
    : formatGoogleDate(event.startDate, event.startTime, 60);

  const params = new URLSearchParams({
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description.slice(0, 1500),
    ctz: event.timezone,
  });

  if (event.location) params.set('location', event.location);

  return `${BASE_URL}?${params.toString()}`;
}
