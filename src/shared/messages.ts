export type Message =
  | { type: 'SCRAPE_REQUEST' }
  | { type: 'SCRAPE_RESULT'; payload: EmailData }
  | { type: 'SCRAPE_ERROR'; payload: string }
  | { type: 'DOWNLOAD_ICS'; payload: { icsContent: string; filename: string } }
  | { type: 'OPEN_URL'; payload: { url: string } };

import type { EmailData } from './types';
