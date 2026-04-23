import { pad, toDateString } from '../shared/utils';

/** IANA timezone lookup keyed by common abbreviation (uppercase). */
const TZ_MAP: Record<string, string> = {
  IST: 'Asia/Kolkata',
  PST: 'America/Los_Angeles',
  PDT: 'America/Los_Angeles',
  MST: 'America/Denver',
  MDT: 'America/Denver',
  CST: 'America/Chicago',
  CDT: 'America/Chicago',
  EST: 'America/New_York',
  EDT: 'America/New_York',
  GMT: 'Etc/GMT',
  UTC: 'UTC',
  BST: 'Europe/London',
  CET: 'Europe/Paris',
  CEST: 'Europe/Paris',
  EET: 'Europe/Athens',
  EEST: 'Europe/Athens',
  MSK: 'Europe/Moscow',
  AST: 'America/Halifax',
  ADT: 'America/Halifax',
  NST: 'America/St_Johns',
  BRT: 'America/Sao_Paulo',
  BRST: 'America/Sao_Paulo',
  ART: 'America/Argentina/Buenos_Aires',
  WAT: 'Africa/Lagos',
  CAT: 'Africa/Harare',
  EAT: 'Africa/Nairobi',
  SAST: 'Africa/Johannesburg',
  GST: 'Asia/Dubai',
  PKT: 'Asia/Karachi',
  BST_BD: 'Asia/Dhaka',
  ICT: 'Asia/Bangkok',
  WIB: 'Asia/Jakarta',
  SGT: 'Asia/Singapore',
  HKT: 'Asia/Hong_Kong',
  CST_CN: 'Asia/Shanghai',
  JST: 'Asia/Tokyo',
  KST: 'Asia/Seoul',
  AEST: 'Australia/Sydney',
  AEDT: 'Australia/Sydney',
  ACST: 'Australia/Adelaide',
  AWST: 'Australia/Perth',
  NZST: 'Pacific/Auckland',
  NZDT: 'Pacific/Auckland',
};

const MONTH_NAMES: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

/** Returns 0=Sunday … 6=Saturday for a day-name string. */
const DAY_OFFSETS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

export interface ParsedDates {
  startDate: string;       // YYYY-MM-DD  (empty string when not found)
  startTime: string | null;
  endDate: string | null;
  endTime: string | null;
  isAllDay: boolean;
  timezone: string;
}

/** Converts 12-hour time parts to 24-hour HH:MM. */
function to24h(hours: number, minutes: number, ampm: string | null): string {
  let h = hours;
  if (ampm) {
    const ap = ampm.toLowerCase().replace(/\./g, '');
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
  }
  return `${pad(h)}:${pad(minutes)}`;
}

/**
 * Parses a time-like string fragment and returns HH:MM (24h) or null.
 * Handles: "3:00 PM", "15:00", "3pm", "3 o'clock", "3.30pm"
 */
function parseTimeFragment(raw: string): string | null {
  // HH:MM[:SS] [AM/PM]
  const hmRe = /(\d{1,2})[:.h](\d{2})(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i;
  const hmMatch = hmRe.exec(raw);
  if (hmMatch) {
    return to24h(Number(hmMatch[1]), Number(hmMatch[2]), hmMatch[3] ?? null);
  }
  // "3pm" / "3 pm"
  const hRe = /(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i;
  const hMatch = hRe.exec(raw);
  if (hMatch) {
    return to24h(Number(hMatch[1]), 0, hMatch[2]);
  }
  return null;
}

/**
 * Detects timezone abbreviation in text and returns IANA string.
 * Falls back to browser local timezone.
 */
function detectTimezone(text: string): string {
  const tzRe = /\b([A-Z]{2,5})\b/g;
  let m: RegExpExecArray | null;
  while ((m = tzRe.exec(text)) !== null) {
    const iana = TZ_MAP[m[1]];
    if (iana) return iana;
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Resolves a relative day name like "tomorrow", "next Monday", "this Friday"
 * relative to `now`. Returns a Date or null.
 */
function resolveRelative(text: string, now: Date): Date | null {
  const lower = text.toLowerCase().trim();

  if (lower === 'today') return new Date(now);
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // "next <day>" or "this <day>"
  const nextRe = /\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i;
  const nextM = nextRe.exec(lower);
  if (nextM) {
    const modifier = nextM[1].toLowerCase();
    const targetDow = DAY_OFFSETS[nextM[2].toLowerCase()];
    const d = new Date(now);
    const currentDow = d.getDay();
    let diff = targetDow - currentDow;
    if (modifier === 'next' && diff <= 0) diff += 7;
    if (modifier === 'this' && diff < 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  return null;
}

/**
 * Main date parsing entry point. Scans full email text for date/time patterns.
 * Returns the first high-confidence match (date range preferred over bare date).
 */
export function parseDates(text: string, subject: string, now = new Date()): ParsedDates {
  const combined = `${subject}\n${text}`;
  const timezone = detectTimezone(combined);
  const currentYear = now.getFullYear();

  // ── Pattern Group 1: ISO 8601 ─────────────────────────────────────────────
  // e.g. 2025-04-28T15:00:00+05:30  or  2025-04-28 at 14:30
  const isoRe = /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:[+-]\d{2}:\d{2}|Z)?(?:\s*[-–—]\s*(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2})?(?:[+-]\d{2}:\d{2}|Z)?)?/;
  const isoM = isoRe.exec(combined);
  if (isoM) {
    return {
      startDate: isoM[1],
      startTime: isoM[2].substring(0, 5),
      endDate: isoM[3] ?? null,
      endTime: isoM[4] ? isoM[4].substring(0, 5) : null,
      isAllDay: false,
      timezone,
    };
  }

  // Spaced ISO: "2025-04-28 at 14:30" or "2025-04-28 14:30"
  const spacedIsoRe = /(\d{4}-\d{2}-\d{2})(?:\s+at\s+|\s+)(\d{2}:\d{2})(?::\d{2})?/;
  const spacedIsoM = spacedIsoRe.exec(combined);
  if (spacedIsoM) {
    return {
      startDate: spacedIsoM[1],
      startTime: spacedIsoM[2].substring(0, 5),
      endDate: null,
      endTime: null,
      isAllDay: false,
      timezone,
    };
  }

  // ── All-day keyword ───────────────────────────────────────────────────────
  const allDayRe = /\ball[\s-]?day\b/i;
  const isAllDay = allDayRe.test(combined);

  // ── Pattern Group 2: "Monday, 28 April 2025, 3:00 PM – 4:30 PM IST" ──────
  const monthNames = Object.keys(MONTH_NAMES)
    .filter((k) => k.length > 3)
    .join('|');
  const monthAbbr = Object.keys(MONTH_NAMES)
    .filter((k) => k.length <= 3)
    .join('|');
  const monthPattern = `(?:${monthNames}|${monthAbbr})`;

  // "April 28, 2025 at 3:00 PM - 4:30 PM" or "28 April 2025 at 3:00 PM"
  const mdy1Re = new RegExp(
    `(${monthPattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})` +
    `(?:\\s+at\\s+|[,\\s]+)(\\d{1,2}[:.h]\\d{2}\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|\\d{1,2}\\s*(?:am|pm))` +
    `(?:\\s*[-–—]\\s*(\\d{1,2}[:.h]\\d{2}\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|\\d{1,2}\\s*(?:am|pm)))?`,
    'i'
  );
  const mdy1M = mdy1Re.exec(combined);
  if (mdy1M) {
    const month = MONTH_NAMES[mdy1M[1].toLowerCase()] ?? 1;
    const day = Number(mdy1M[2]);
    const year = Number(mdy1M[3]);
    const startTime = parseTimeFragment(mdy1M[4]);
    const endTime = mdy1M[5] ? parseTimeFragment(mdy1M[5]) : null;
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    return {
      startDate: dateStr,
      startTime,
      endDate: null,
      endTime,
      isAllDay: isAllDay || startTime === null,
      timezone,
    };
  }

  // "28 April 2025 at 3pm" / "28 April 2025, 3:00 PM – 4:30 PM"
  const dmy1Re = new RegExp(
    `(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\.?\\s+(\\d{4})` +
    `(?:\\s+at\\s+|[,\\s]+)?(\\d{1,2}[:.h]\\d{2}\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|\\d{1,2}\\s*(?:am|pm))?` +
    `(?:\\s*[-–—]\\s*(\\d{1,2}[:.h]\\d{2}\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|\\d{1,2}\\s*(?:am|pm)))?`,
    'i'
  );
  const dmy1M = dmy1Re.exec(combined);
  if (dmy1M) {
    const day = Number(dmy1M[1]);
    const month = MONTH_NAMES[dmy1M[2].toLowerCase()] ?? 1;
    const year = Number(dmy1M[3]);
    const startTime = dmy1M[4] ? parseTimeFragment(dmy1M[4]) : null;
    const endTime = dmy1M[5] ? parseTimeFragment(dmy1M[5]) : null;
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    return {
      startDate: dateStr,
      startTime,
      endDate: null,
      endTime,
      isAllDay: isAllDay || startTime === null,
      timezone,
    };
  }

  // ── Pattern Group 2b: DD/MM/YYYY HH:MM - HH:MM ───────────────────────────
  // e.g. "28/04/2025 15:00 - 16:30" or "04/28/2025 3:00 PM"
  const slashRe = /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}[:.]\d{2}(?:\s*(?:am|pm))?|\d{1,2}\s*(?:am|pm)))?(?:\s*[-–—]\s*(\d{1,2}[:.]\d{2}(?:\s*(?:am|pm))?|\d{1,2}\s*(?:am|pm)))?/i;
  const slashM = slashRe.exec(combined);
  if (slashM) {
    // Heuristic: if first num ≤ 12 AND second > 12, first is month (US style)
    let month: number, day: number;
    const a = Number(slashM[1]);
    const b = Number(slashM[2]);
    if (a <= 12 && b > 12) {
      month = a; day = b;
    } else {
      day = a; month = b;
    }
    const year = Number(slashM[3]);
    const startTime = slashM[4] ? parseTimeFragment(slashM[4]) : null;
    const endTime = slashM[5] ? parseTimeFragment(slashM[5]) : null;
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    return {
      startDate: dateStr,
      startTime,
      endDate: null,
      endTime,
      isAllDay: isAllDay || startTime === null,
      timezone,
    };
  }

  // ── Pattern Group 2c: "Monday, 28 April 2025, 3:00 PM – 4:30 PM IST" ─────
  const dayMonthRe = new RegExp(
    `(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun),?\\s+` +
    `(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\.?\\s+(\\d{4}),?\\s+` +
    `(\\d{1,2}[:.h]\\d{2}\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|\\d{1,2}\\s*(?:am|pm))` +
    `(?:\\s*[-–—]\\s*(\\d{1,2}[:.h]\\d{2}\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|\\d{1,2}\\s*(?:am|pm)))?`,
    'i'
  );
  const dayMonthM = dayMonthRe.exec(combined);
  if (dayMonthM) {
    const day = Number(dayMonthM[1]);
    const month = MONTH_NAMES[dayMonthM[2].toLowerCase()] ?? 1;
    const year = Number(dayMonthM[3]);
    const startTime = parseTimeFragment(dayMonthM[4]);
    const endTime = dayMonthM[5] ? parseTimeFragment(dayMonthM[5]) : null;
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    return {
      startDate: dateStr,
      startTime,
      endDate: null,
      endTime,
      isAllDay: isAllDay,
      timezone,
    };
  }

  // ── Pattern Group 3: Bare dates ───────────────────────────────────────────
  // "April 28, 2025" / "April 28 2025"
  const mdyBareRe = new RegExp(
    `(${monthPattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`,
    'i'
  );
  const mdyBareM = mdyBareRe.exec(combined);
  if (mdyBareM) {
    const month = MONTH_NAMES[mdyBareM[1].toLowerCase()] ?? 1;
    const day = Number(mdyBareM[2]);
    const year = Number(mdyBareM[3]);
    const timeRaw = combined.slice(mdyBareM.index + mdyBareM[0].length, mdyBareM.index + mdyBareM[0].length + 30);
    const startTime = parseTimeFragment(timeRaw);
    return {
      startDate: `${year}-${pad(month)}-${pad(day)}`,
      startTime,
      endDate: null,
      endTime: null,
      isAllDay: isAllDay || startTime === null,
      timezone,
    };
  }

  // "28 April 2025"
  const dmyBareRe = new RegExp(
    `(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})\\.?\\s+(\\d{4})`,
    'i'
  );
  const dmyBareM = dmyBareRe.exec(combined);
  if (dmyBareM) {
    const day = Number(dmyBareM[1]);
    const month = MONTH_NAMES[dmyBareM[2].toLowerCase()] ?? 1;
    const year = Number(dmyBareM[3]);
    const timeRaw = combined.slice(dmyBareM.index + dmyBareM[0].length, dmyBareM.index + dmyBareM[0].length + 30);
    const startTime = parseTimeFragment(timeRaw);
    return {
      startDate: `${year}-${pad(month)}-${pad(day)}`,
      startTime,
      endDate: null,
      endTime: null,
      isAllDay: isAllDay || startTime === null,
      timezone,
    };
  }

  // "Monday April 28" (no year — use current year)
  const noYearRe = new RegExp(
    `(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)?\\s*` +
    `(${monthPattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\s*,?\\s*\\d{4})`,
    'i'
  );
  const noYearM = noYearRe.exec(combined);
  if (noYearM) {
    const month = MONTH_NAMES[noYearM[1].toLowerCase()] ?? 1;
    const day = Number(noYearM[2]);
    return {
      startDate: `${currentYear}-${pad(month)}-${pad(day)}`,
      startTime: null,
      endDate: null,
      endTime: null,
      isAllDay: true,
      timezone,
    };
  }

  // ── Pattern Group 4: Relative dates ──────────────────────────────────────
  const relRe = /\b(today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)|this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun))\b/i;
  const relM = relRe.exec(combined);
  if (relM) {
    const resolved = resolveRelative(relM[1], now);
    if (resolved) {
      const timeRaw = combined.slice(relM.index + relM[0].length, relM.index + relM[0].length + 30);
      const startTime = parseTimeFragment(timeRaw);
      return {
        startDate: toDateString(resolved),
        startTime,
        endDate: null,
        endTime: null,
        isAllDay: isAllDay || startTime === null,
        timezone,
      };
    }
  }

  // ── No date found ─────────────────────────────────────────────────────────
  return {
    startDate: '',
    startTime: null,
    endDate: null,
    endTime: null,
    isAllDay: isAllDay,
    timezone,
  };
}
