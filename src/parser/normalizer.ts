/** Strips HTML tags, decodes entities, collapses whitespace. */
export function normalizeText(raw: string): string {
  let text = raw;

  // Convert block-level elements to newlines before stripping tags
  text = text.replace(/<\/?(p|div|br|li|h[1-6]|tr|td|th)[^>]*>/gi, '\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));

  // Collapse whitespace (preserve newlines)
  text = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return text.trim();
}
