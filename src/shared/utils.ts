/**
 * Pads a number to at least `width` digits with leading zeros.
 */
export function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/**
 * Formats a Date as YYYY-MM-DD.
 */
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Formats a Date as HH:MM (24-hour).
 */
export function toTimeString(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Clamps a number between min and max.
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
