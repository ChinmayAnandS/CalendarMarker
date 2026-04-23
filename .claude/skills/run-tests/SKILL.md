---
name: run-tests
description: Run all unit and e2e tests and show a pass/fail summary.
user-invocable: true
---
Steps:
1. Run `npx vitest run --reporter=verbose`.
2. If any test fails, show the full error and diff.
3. Ask: "Should I attempt to auto-fix the failing tests?"
4. If yes, fix the implementation (not the test assertions) and re-run.
