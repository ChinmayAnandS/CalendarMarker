---
name: add-email-parser
description: Add support for a new email client detector. Run with /add-email-parser <hostname>
argument-hint: "<hostname> e.g. protonmail.com"
user-invocable: true
---
When invoked with email client hostname $0:
1. Create src/content/detectors/<slug>.ts implementing the EmailDetector interface.
   Use gmail.ts as the template. Research the correct DOM selectors for $0.
2. Register the detector in src/content/detectors/index.ts.
3. Add host_permission for $0 in wxt.config.ts.
4. Create tests/unit/detectors/<slug>.test.ts with a JSDOM fixture.
5. Add a fixture HTML file to fixtures/<slug>-event-email.html.
6. Run `npx vitest run tests/unit/detectors/<slug>.test.ts` to verify.
7. Update CLAUDE.md under "Supported Email Clients".
