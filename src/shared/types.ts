export interface ExtractedEvent {
  title: string;
  startDate: string;        // YYYY-MM-DD
  startTime: string | null; // HH:MM (24h) or null for all-day
  endDate: string | null;   // YYYY-MM-DD
  endTime: string | null;   // HH:MM (24h)
  location: string | null;
  description: string;
  attendees: string[];      // email addresses
  timezone: string;         // IANA e.g. "Asia/Kolkata"
  isAllDay: boolean;
  rawSubject: string;
  rawBody: string;
  confidence: 'high' | 'medium' | 'low';
}

export type CalendarProvider = 'google' | 'outlook' | 'apple';

export interface EmailData {
  subject: string;
  body: string;
  sender: string | null;
}

export type AppState =
  | { status: 'idle' }
  | { status: 'no-email' }
  | { status: 'parsing'; emailData: EmailData }
  | { status: 'review'; event: ExtractedEvent }
  | { status: 'success'; provider: CalendarProvider; url?: string }
  | { status: 'error'; message: string };
