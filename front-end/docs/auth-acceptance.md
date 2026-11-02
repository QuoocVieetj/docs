# FE mock acceptance — 29/10/2026

## Delivered
- React Router, ESLint/Prettier/check command, shared responsive shell.
- Role menus Admin/Manager/Employee, guard, internal return path,403/404.
- Login, forgot-password, change-password; pending and validation states.
- MSW handlers and FE OpenAPI proposal0.1.0, schema assertions.
- In-memory access token, synthetic persisted mock session for reload.
- Refresh once/replay once, shared refresh promise, failure logout, late response
  protection, canceled account requests on page departure.
- Minimal document fixtures verify department/assignee scope, without CRUD.

## Evidence
`npm run check` passed: lint zero warnings/errors, format correct, 21 tests passed,
production build passed. Production application bundle excludes MSW startup.
Independent review found a stale-login response issue; regression test reproduced
it before cancellation was added, and the final suite passed afterward.

Browser Chrome checks passed: login all3 roles, reload restores session, Manager
approvals, Admin users, Employee forbidden admin URL, expired access refreshes,
expired refresh logs out, document cross-scope403, no horizontal overflow at
320/375/768/1440px. Expected401/403 responses are part of these checks.

## Explicit limits
- All business pages are shells. Document CRUD/real files/approval workflow later.
- Real backend, HttpOnly cookies, production deployment and actual email untested.
- Changed demo passwords reset on reload; disclosed in contract and README.
- No mandatory BE confirmation gate. FE mock delivery can be reviewed independently.
