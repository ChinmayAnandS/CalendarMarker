# CalendarMarker

A Chrome extension that converts emails into calendar events — **fully offline, no API keys required**.

## Features

- Detects when you're reading an email in Gmail, Outlook Web, Yahoo Mail, or Apple iCloud Mail
- Injects a floating **📅 Add to Calendar** button into the email toolbar
- Extracts event title, date/time, location, attendees, and timezone using pure regex (no AI, no network)
- Shows a pre-filled, editable event form before export
- Exports to:
  - **Google Calendar** — opens a pre-filled compose page (no login needed)
  - **Outlook Calendar** — opens a pre-filled compose page (no login needed)
  - **Apple Calendar / any app** — downloads a valid `.ics` file

Works 100% offline after installation. No accounts. No API keys.

## Installation

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/ChinmayAnandS/CalendarMarker
   cd CalendarMarker
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** → select the `.output/chrome-mv3/` folder

## Development

```bash
npm run build          # Build extension
npm run zip            # Build + package into a distributable .zip
npm test               # Run unit tests
npx playwright test tests/e2e/   # Run e2e tests
```

## Tech Stack

- **WXT** — MV3 extension framework (Vite-based)
- **React 18 + TypeScript** — Popup UI
- **Tailwind CSS v3** — Styling (bundled, no CDN)
- **Zustand** — Lightweight state management
- **Vitest** — Unit tests (87 tests, 91% coverage)
- **Playwright** — E2E tests

## Supported Email Clients

| Client | Hostname |
|---|---|
| Gmail | mail.google.com |
| Outlook Web | outlook.live.com, outlook.office.com |
| Yahoo Mail | mail.yahoo.com |
| Apple iCloud Mail | www.icloud.com |

## License

MIT
