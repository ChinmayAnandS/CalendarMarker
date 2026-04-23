import type { EmailData } from '../../shared/types';

export interface EmailDetector {
  name: string;
  hostname: string | string[];
  isEmailOpen(): boolean;
  extractEmailData(): EmailData | null;
  /** Injects the floating button. Returns a cleanup function that removes it. */
  injectButton(onClick: () => void): () => void;
}

export { GmailDetector } from './gmail';
export { OutlookWebDetector } from './outlook-web';
export { YahooMailDetector } from './yahoo-mail';
export { AppleMailWebDetector } from './apple-mail-web';

import { GmailDetector } from './gmail';
import { OutlookWebDetector } from './outlook-web';
import { YahooMailDetector } from './yahoo-mail';
import { AppleMailWebDetector } from './apple-mail-web';

export const detectorRegistry: EmailDetector[] = [
  new GmailDetector(),
  new OutlookWebDetector(),
  new YahooMailDetector(),
  new AppleMailWebDetector(),
];

/**
 * Returns the matching detector for the current page hostname, or null.
 */
export function findDetector(hostname: string): EmailDetector | null {
  return (
    detectorRegistry.find((d) => {
      const h = d.hostname;
      return Array.isArray(h) ? h.includes(hostname) : h === hostname;
    }) ?? null
  );
}
