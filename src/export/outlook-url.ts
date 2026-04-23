import type { ExtractedEvent } from '../shared/types';
import { pad } from '../shared/utils';

const BASE_URL = 'https://outlook.live.com/calendar/0/deeplink/compose';

/**
 * Converts a date + optional time to an ISO 8601 string for Outlook's URL scheme.
 * @param date - YYYY-MM-DD
 * @param time - HH:MM or null
 * @param _timezone - IANA timezone (Outlook interprets as local; included for completeness)
 * @param offsetMinutes - optional offset in minutes to add
 */
function toISO(date: string, time: string | null, _timezone: string, offsetMinutes = 0): string {
  const [y, mo, d] = date.split('-').map(Number);
  if (!time) {
    // All-day: just date
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  const [h, min] = time.split(':').map(Number);
  const dt = new Date(y, mo - 1, d, h, min + offsetMinutes, 0);
  return (
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}:${pad(dt.getMinutes())}:00`
  );
}

/**
 * Builds an Outlook Live Calendar pre-filled event URL (no OAuth required).
 */
export function buildOutlookUrl(event: ExtractedEvent): string {
  const startdt = toISO(event.startDate, event.startTime, event.timezone);
  const enddt = toISO(
    event.endDate || event.startDate,
    event.endTime || event.startTime,
    event.timezone,
    event.endTime ? 0 : 60
  );

  const params = new URLSearchParams({
    subject: event.title,
    startdt,
    enddt,
    body: event.description.slice(0, 1000),
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  if (event.location) params.set('location', event.location);

  return `${BASE_URL}?${params.toString()}`;
}
