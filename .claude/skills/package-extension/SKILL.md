---
name: package-extension
description: Build, test, and produce a distributable zip of the extension.
user-invocable: true
---
Steps:
1. Run `npx vitest run` — abort if any test fails.
2. Run `npx wxt build` — abort on TypeScript errors.
3. Run `npx wxt zip`.
4. Report the output zip path and file size.
5. Print this checklist:
   [ ] Icons present at 16, 32, 48, 128px
   [ ] manifest version matches package.json
   [ ] No console.log statements left in src/
   [ ] No hardcoded URLs other than calendar provider endpoints
   [ ] All test fixtures committed
   [ ] README.md explains offline-only operation
