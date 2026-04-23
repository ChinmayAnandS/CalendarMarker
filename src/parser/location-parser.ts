/** Zoom/Meet/Teams/Webex virtual meeting URL pattern. */
const VIRTUAL_URL_RE = /https?:\/\/(?:[\w-]+\.)?(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com|whereby\.com|gotomeeting\.com)\/[^\s<>"]+/i;

/** Lines containing explicit location keywords. */
const LOCATION_KEYWORD_RE = /^(?:venue|location|address|place|held\s+at|taking\s+place\s+at|at)\s*[:\-–]?\s*(.+)/i;

/** Street address: number + word(s) + road type. */
const STREET_ADDRESS_RE = /\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Road|Street|St|Avenue|Ave|Lane|Ln|Boulevard|Blvd|Drive|Dr|Way|Nagar|Marg|Cross|Circle|Court|Ct|Place|Pl|Park|Square|Sq)\b/;

/**
 * Extracts a meeting location or virtual URL from email body text.
 * Priority: virtual URL > explicit keyword line > street address.
 */
export function parseLocation(text: string): string | null {
  // 1. Virtual meeting URL
  const urlMatch = VIRTUAL_URL_RE.exec(text);
  if (urlMatch) return urlMatch[0].trim().slice(0, 200);

  // 2. Explicit location keyword lines
  for (const line of text.split('\n')) {
    const kwMatch = LOCATION_KEYWORD_RE.exec(line);
    if (kwMatch && kwMatch[1].trim().length > 1) {
      return kwMatch[1].trim().slice(0, 200);
    }
  }

  // 3. Street address pattern
  const addrMatch = STREET_ADDRESS_RE.exec(text);
  if (addrMatch) return addrMatch[0].trim().slice(0, 200);

  return null;
}
