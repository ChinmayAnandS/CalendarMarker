# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CalendarMarker is a Chrome extension (MV3) that converts emails into Google Calendar / Outlook / Apple Calendar events — **100% offline, zero API keys, zero network calls**.

- Built with **WXT** (MV3 framework), **React 18**, **TypeScript strict**, **Tailwind CSS v3**
- Tests: **Vitest** (unit) + **Playwright** (e2e)
- Google and Outlook export use their public URL schemes (pre-filled compose pages), not OAuth APIs

## Commands

```bash
npm install              # Install dependencies
npm run build            # Build extension → .output/chrome-mv3/
npm run zip              # Build + package → .output/email-to-calendar-*.zip
npm test                 # Run unit tests (Vitest)
npx vitest run --reporter=verbose   # Verbose unit test output
npx playwright test tests/e2e/      # Run e2e tests
npm run generate-icons   # Regenerate public/icons/ PNG files
```

## Architecture

WXT requires entrypoints in `src/entrypoints/`:
- `src/entrypoints/background.ts` — Service worker; handles `DOWNLOAD_ICS` (chrome.downloads) and `OPEN_URL` (chrome.tabs) messages only.
- `src/entrypoints/content.ts` — Content script; detects email client, injects button, responds to `SCRAPE_REQUEST` messages.
- `src/entrypoints/popup/index.html` + `index.tsx` — React popup UI.

Application code lives in `src/` subdirectories:
- `src/content/detectors/` — One `EmailDetector` class per client (Gmail, Outlook, Yahoo, Apple).
- `src/parser/` — All offline extraction logic: normalizer → date-parser → location-parser → attendee-parser → index.
- `src/export/` — `google-url.ts`, `outlook-url.ts`, `ics-generator.ts`.
- `src/popup/` — `App.tsx`, `store.ts` (Zustand), and `components/`.
- `src/shared/` — `types.ts`, `messages.ts`, `utils.ts`.

### Message flow

```
Popup opens → sends SCRAPE_REQUEST to active tab
Content script → calls extractEmailData() → returns SCRAPE_RESULT
Popup → calls parseEmail() → shows EventForm
User clicks export → Popup builds URL or ICS → sends OPEN_URL or DOWNLOAD_ICS to background
Background → opens tab or triggers download
```

## Email-to-Calendar — Project Conventions

### Architecture Rules
- ZERO network calls from the extension. No `fetch()`, no `XMLHttpRequest`, no `WebSocket`.
- ZERO external APIs. Google/Outlook export uses URL schemes only.
- All parsing logic lives in `src/parser/`. No parsing in content scripts or popup.
- Content scripts only: scrape DOM + inject button. Nothing else.
- Background service worker only: handle downloads + open tabs. Nothing else.
- Popup: render UI, call parser, build export URLs. No DOM access to the page.

### Code Standards
- TypeScript strict mode. No `any`. No `@ts-ignore`.
- Every exported function has a JSDoc comment with `@param` and `@returns`.
- Functional React only. No class components.
- All regex patterns are documented with a comment explaining what they match.
- Selectors for email clients are constants in the detector file, not inline strings.

### Testing Standards
- Unit tests must not use real network or real DOM (use JSDOM or mocks).
- Parser tests cover happy path, partial match, and no-match cases.
- ICS tests validate RFC 5545 line-length compliance.
- Minimum coverage: 80% on `src/parser/` and `src/export/`.

### Supported Email Clients
- Gmail (`mail.google.com`)
- Outlook Web (`outlook.live.com`, `outlook.office.com`)
- Yahoo Mail (`mail.yahoo.com`)
- Apple iCloud Mail (`www.icloud.com`)

### Slash Commands
- `/add-email-parser <hostname>` — add a new email client detector
- `/run-tests` — run full test suite with auto-fix offer
- `/package-extension` — build + test + zip
