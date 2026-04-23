import type { ExtractedEvent } from '../shared/types';
import { pad } from '../shared/utils';

/**
 * Folds a single ICS property line per RFC 5545 §3.1:
 * Lines must not exceed 75 octets; continuation lines begin with a single space.
 */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let offset = 0;

  // First line: 75 octets
  while (offset < bytes.length) {
    const limit = offset === 0 ? 75 : 74; // continuation lines have leading space (1 byte)
    let chunkEnd = offset + limit;

    // Don't split a multi-byte UTF-8 sequence
    if (chunkEnd < bytes.length) {
      while (chunkEnd > offset && (bytes[chunkEnd]! & 0xc0) === 0x80) {
        chunkEnd--;
      }
    }

    const chunk = new TextDecoder().decode(bytes.slice(offset, chunkEnd));
    parts.push(offset === 0 ? chunk : ' ' + chunk);
    offset = chunkEnd;
  }

  return parts.join('\r\n');
}

/**
 * Escapes ICS property values per RFC 5545 (backslash, semicolon, comma, newline).
 */
function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Formats a UTC Date as ICS timestamp: YYYYMMDDTHHmmSSZ
 */
function formatDTSTAMP(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/**
 * Formats a date (YYYY-MM-DD) + optional time (HH:MM) as ICS DTSTART/DTEND value.
 * All-day events use DATE value type; timed events use TZID or local.
 */
function formatDT(
  date: string,
  time: string | null,
  isAllDay: boolean,
  timezone: string
): { param: string; value: string } {
  if (isAllDay || !time) {
    const [y, mo, d] = date.split('-');
    return { param: ';VALUE=DATE', value: `${y}${mo}${d}` };
  }
  const [y, mo, d] = date.split('-');
  const [h, min] = time.split(':');
  const value = `${y}${mo}${d}T${h}${min}00`;
  return { param: `;TZID=${timezone}`, value };
}

/**
 * Generates a valid RFC 5545 iCalendar (.ics) string for the given event.
 * No external dependencies — all formatting is done inline.
 */
export function generateICS(event: ExtractedEvent): string {
  const now = new Date();
  const uid = `${Date.now()}@email2cal`;
  const dtstamp = formatDTSTAMP(now);

  const dtStart = formatDT(event.startDate, event.startTime, event.isAllDay, event.timezone);
  const endDate = event.endDate || event.startDate;
  const endTime = event.endTime || event.startTime;

  // For all-day end date, RFC 5545 uses exclusive end date (next day)
  let dtEndValue: string;
  let dtEndParam: string;
  if (event.isAllDay || !endTime) {
    const [y, mo, d] = endDate.split('-').map(Number);
    const next = new Date(y, mo - 1, d + 1);
    dtEndParam = ';VALUE=DATE';
    dtEndValue = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  } else {
    const r = formatDT(endDate, endTime, false, event.timezone);
    dtEndParam = r.param;
    dtEndValue = r.value;
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Email2Cal//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART${dtStart.param}:${dtStart.value}`,
    `DTEND${dtEndParam}:${dtEndValue}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description.slice(0, 500))}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }

  for (const attendee of event.attendees) {
    lines.push(`ATTENDEE:MAILTO:${attendee}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  // Fold long lines and join with CRLF per RFC 5545
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
