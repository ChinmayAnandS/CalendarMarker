/** RFC 5322-ish email address pattern. */
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const MAX_ATTENDEES = 20;

/**
 * Extracts and deduplicates email addresses from text.
 * Returns at most 20 lowercase addresses.
 */
export function parseAttendees(text: string): string[] {
  const matches = text.match(EMAIL_RE) ?? [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const addr of matches) {
    const lower = addr.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(lower);
      if (result.length >= MAX_ATTENDEES) break;
    }
  }
  return result;
}
