# Admin, Organizer, Reports & Audit Module — Sprint 2 Test Plan & Execution Report
**Module:** Admin Management, Reports, Organizer Participant Management & Audit Log (US-14, US-15, US-32, US-33, US-34, US-35, US-36)
**Author:** Atharv Kulkarni (Development Lead, Team 7)
**Sprint:** Sprint 2 (SE Mini Project, PES University)
**SRS / SAD References:** EMS-F-013, EMS-F-014, EMS-F-015, EMS-SR-001, EMS-SR-002, EMS-NF-001, EMS-NF-005

---

## 1. Test Summary

| Test Suite File | Category | Test Cases | Passed | Failed | Blocked | Execution Status |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `backend/tests/admin.test.js` | TC-ADM-01: Admin Authorization & Resource Management | 9 | 9 | 0 | 0 | 100% Passed |
| `backend/tests/organizer.test.js` | TC-ORG-01: Organizer Participant Access & Scoping | 5 | 5 | 0 | 0 | 100% Passed |
| `backend/tests/reports.test.js` | TC-REP-01: Report Calculations & Data Isolation | 4 | 4 | 0 | 0 | 100% Passed |
| `backend/tests/audit.test.js` | TC-AUD-01: Audit Log Creation & Action Filtering | 3 | 3 | 0 | 0 | 100% Passed |
| **Total Automated Tests** | **All 4 Categories** | **21** | **21** | **0** | **0** | **100% Passed** |

*All 21 automated tests execute with 100% database isolation using Jest test doubles (`jest.spyOn`), ensuring zero mutation of the development database (`event_management`).*

---

## 2. Test Execution Matrix

| Test ID | Requirement ID | Test Title | Test Type | Pre-condition | Input / Action | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|
| **TC-ADM-01a** | EMS-SR-001 | Unauthenticated Access Protection | Security / Access Control | No JWT provided in request header | Send unauthenticated request to `/api/admin/*` | HTTP 401 Unauthorized; message "Authentication required" | Returns 401, blocked before controller | ✅ PASS |
| **TC-ADM-01b** | EMS-SR-002 | Role Authorization Guard (Non-Admin Blocked) | Security / RBAC | Authenticated with `role: "participant"` | Attempt access to `/api/admin/users` | HTTP 403 Forbidden; message "Access forbidden" | Returns 403, non-admin denied | ✅ PASS |
| **TC-ADM-01c** | EMS-SR-002 | Role Authorization Guard (Admin Permitted) | Security / RBAC | Authenticated with `role: "administrator"` | Access `/api/admin/users` | Request successfully forwarded to controller (`next()` invoked) | Passes middleware successfully | ✅ PASS |
| **TC-ADM-01d** | US-32 / EMS-F-013 | Retrieve All Users with Sanitized Fields | Functional / Admin | Administrator logged in | `GET /api/admin/users` | HTTP 200 OK; returns array of user accounts ordered by `createdAt DESC` | Returns 200, count matches, passwords omitted | ✅ PASS |
| **TC-ADM-01e** | US-32 / EMS-F-014 | Retrieve All Events with Organizer Data | Functional / Admin | Administrator logged in | `GET /api/admin/events` | HTTP 200 OK; returns events across all statuses (draft, published, cancelled) with organizer details | Returns 200, joined organizer attached | ✅ PASS |
| **TC-ADM-01f** | US-32 | Reject Invalid User ID on Deletion | Validation / Edge Case | Administrator logged in | `DELETE /api/admin/users/abc` (non-integer ID) | HTTP 400 Bad Request; message "Invalid user ID provided" | Returns 400, invalid ID rejected | ✅ PASS |
| **TC-ADM-01g** | US-32 | Prevent Administrator Self-Deletion | Safety / Business Rule | Administrator ID = 1 | `DELETE /api/admin/users/1` | HTTP 400 Bad Request; message "Administrators cannot delete their own account" | Returns 400, self-deletion prevented | ✅ PASS |
| **TC-ADM-01h** | US-32 / EMS-SR-002 | Reject User Deletion with Dependent Records | Integrity / Foreign Key Protection | User has created events or active registrations | `DELETE /api/admin/users/:userId` | HTTP 409 Conflict; message "Cannot safely delete user: associated event or registration records exist" | Returns 409, cascade deletion prevented | ✅ PASS |
| **TC-ADM-01i** | US-32 / EMS-F-014 | Administrative Event Cancellation | Functional / Admin Action | Event in `published` status | `PATCH /api/admin/events/:eventId/cancel` | HTTP 200 OK; event status updated to `cancelled`; message returned | Returns 200, event marked cancelled | ✅ PASS |
| **TC-ORG-01a** | US-15 / US-34 | Reject Invalid Event ID on Participant Fetch | Validation / Edge Case | Authenticated as organizer | `GET /api/events/abc/participants` | HTTP 400 Bad Request; message "Invalid event ID provided" | Returns 400, bad ID rejected | ✅ PASS |
| **TC-ORG-01b** | US-15 / US-34 | Event Not Found Handling | Functional / Error Handling | Event ID does not exist | `GET /api/events/9999/participants` | HTTP 404 Not Found; message "Event not found" | Returns 404, clean error returned | ✅ PASS |
| **TC-ORG-01c** | US-15 / US-34 | Organizer Event Ownership Enforcement | Security / Data Isolation | Organizer A requests event created by Organizer B | `GET /api/events/:eventId/participants` | HTTP 403 Forbidden; message "You are not authorized to view participants for this event" | Returns 403, foreign event blocked | ✅ PASS |
| **TC-ORG-01d** | US-15 / US-34 | Owner Organizer Access to Participant Roster | Functional / Organizer Portal | Organizer owns the target event | `GET /api/events/:eventId/participants` | HTTP 200 OK; returns event metadata, capacity, ticket codes, attendee names, emails, and statuses | Returns 200, full attendee list provided | ✅ PASS |
| **TC-ORG-01e** | US-15 / US-34 | Administrator Universal Participant Access | Functional / Governance | Administrator accesses any event | `GET /api/events/:eventId/participants` | HTTP 200 OK; administrator granted access regardless of event creator | Returns 200, global oversight enabled | ✅ PASS |
| **TC-REP-01a** | US-33 / EMS-F-015 | Global Summary Metrics & Fill-Rate (Admin) | Business Logic / Analytics | Administrator logged in | `GET /api/reports/summary` | HTTP 200 OK; `scope: "global"`, full user breakdown, event counts, capacity, and overall fill rate | Returns 200, accurate global aggregates | ✅ PASS |
| **TC-REP-01b** | US-33 / EMS-F-015 | Organizer Scoped Reports & Data Isolation | Security / Privacy | Organizer logged in | `GET /api/reports/summary` | HTTP 200 OK; `scope: "organizer"`, `userStats: null`, event and registration stats scoped strictly to owned events | Returns 200, strict data isolation | ✅ PASS |
| **TC-REP-01c** | US-33 / EMS-F-015 | Fill-Rate Zero Capacity Safeguard | Mathematical Safety | Published events capacity = 0 | `GET /api/reports/summary` | HTTP 200 OK; `overallFillRatePercent: 0` without division-by-zero runtime error | Returns 200, fill-rate safely 0% | ✅ PASS |
| **TC-REP-01d** | US-33 / EMS-F-015 | Per-Event Detailed Attendance Report | Business Logic / Analytics | Authenticated user | `GET /api/reports/events` | HTTP 200 OK; returns confirmed, cancelled, spots remaining, occupancy %, and `isFull` flag | Returns 200, per-event breakdown verified | ✅ PASS |
| **TC-AUD-01a** | US-36 | Audit Log on Event Cancellation | Compliance / Audit Trail | Administrator cancels event | `PATCH /api/admin/events/:eventId/cancel` | AuditLog entry created with `action: "EVENT_CANCELLED"`, `entityType: "event"`, actor ID | AuditLog created with correct action & payload | ✅ PASS |
| **TC-AUD-01b** | US-36 | Audit Log on User Deletion After Success | Safety / Audit Ordering | Deletion succeeds | `DELETE /api/admin/users/:userId` | AuditLog entry created with `action: "USER_DELETED"` strictly after `user.destroy()` completes | Verified call order: `user.destroy` before `AuditLog.create` | ✅ PASS |
| **TC-AUD-01c** | US-36 | Audit Log Retrieval & Action Filtering | Functional / Audit Viewer | Administrator logged in | `GET /api/admin/audit-logs?action=EVENT_CANCELLED` | HTTP 200 OK; returns chronological audit entries filtered by action type with joined actor details | Returns 200, filtered logs returned | ✅ PASS |

---

## 3. Frontend Responsive & Accessibility Design Verification (US-32, US-33, US-34)

The frontend components (`AdminDashboard.jsx`, `EventParticipants.jsx`, `Reports.jsx`) were verified via ESLint (`npm run lint`), production build (`npm run build`), and structural design inspection for responsive layout and accessibility standards:

- **Mobile Viewport Structure (375px - 767px):**
  - Collapsible navigation hamburger button with `aria-label` and `aria-expanded` state tracking.
  - KPI metric strips wrap into single-column vertical stacks.
  - High-density data tables contained in horizontal scroll wrappers (`overflow-x: auto`) to prevent layout distortion.
- **Tablet Viewport Structure (768px - 1023px):**
  - 2-column KPI metric summary cards.
  - Toolbar controls (search bars, filter pills, CSV export) wrap cleanly across viewports.
- **Desktop Viewport Structure (1024px+):**
  - Full-width multi-column tabular dashboards with clean typography and status badges.
- **Accessibility & Semantic Elements:**
  - Semantic HTML5 landmark structure: `<main>`, `<header>`, `<nav>`, `<section>`, `<table>`, `<thead>`, `<tbody>`.
  - Accessible button attributes (`type="button"`, explicit `aria-label`).
  - Native browser CSV generation using standard `Blob` APIs without popup blockers or external dependencies.

---

## 4. Teammate Isolation & Non-Interference Guarantee

- **Ashmita's Files:** `authController.js`, `authMiddleware.js`, `roleMiddleware.js`, `User.js`, `Login.jsx`, `Register.jsx` — **0 modifications**.
- **Aryan's Files:** `eventController.js`, `eventRoutes.js`, `Event.js`, `CreateEvent.jsx`, `Events.jsx` — **0 modifications**.
- **Ashwath's Files:** `registrationController.js`, `registrationRoutes.js`, `Registration.js`, `AuditLog.js`, `MyRegistrations.jsx`, `registrations.test.js`, `REGISTRATION_MODULE_TEST_CASES.md` — **0 modifications**.
- **Regression Suite:** Running `npx jest tests/registrations.test.js` continues to pass 12/12 tests with 100% success.
