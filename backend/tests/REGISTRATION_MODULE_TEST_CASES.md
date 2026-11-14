# Registration Module — Sprint 2 Test Plan & Execution Report
**Module:** Event Registration (US-27, US-28, US-29, US-30, US-31)  
**Author:** Ashwath Rohan  
**Sprint:** Sprint 2 (SE Mini Project)  
**SRS Reference:** EMS-F-009, EMS-F-010, EMS-F-011, EMS-F-012, EMS-SR-001, EMS-SR-002, EMS-NF-005  

---

## 1. Test Summary

| Total Test Cases | Passed | Failed | Blocked | Execution Status |
|------------------|--------|--------|---------|------------------|
| 10               | 10     | 0      | 0       | 100% Passed      |

---

## 2. Test Execution Matrix

| Test ID | Requirement ID | Test Title | Test Type | Pre-condition | Input / Action | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|
| **TC-REG-01** | EMS-F-009 | Successful Participant Registration | Functional / Integration | User logged in, published event exists with available capacity | Click "Register for Event" (or `POST /api/registrations` with `eventId`) | HTTP 201 Created; Unique ticket code generated; Confirmation popup displayed | Returns 201, valid ticket code (format `TKT-E*-U*-*`), seat reserved | ✅ PASS |
| **TC-REG-02** | EMS-F-010 | Duplicate Registration Prevention | Functional / Edge Case | User already actively registered for event | Attempt to register again for the same event | HTTP 400 Bad Request; message "You are already registered for this event" | Returns 400, duplicate rejected, no duplicate ticket generated | ✅ PASS |
| **TC-REG-03** | EMS-F-011 | Capacity Limit Control | Functional / Boundary | Event capacity = N, confirmed count = N | Attempt registration when no seats remain | HTTP 400 Bad Request; message "Event has reached maximum capacity" | Returns 400 with capacity exceeded error, seat count strictly capped | ✅ PASS |
| **TC-REG-04** | EMS-F-009 | Reject Registration for Draft/Cancelled Event | Validation / Edge Case | Event status is `draft` or `cancelled` | Send `POST /api/registrations` with draft event ID | HTTP 400 Bad Request; message "Registrations are only open for published events" | Returns 400, registration blocked | ✅ PASS |
| **TC-REG-05** | EMS-F-009 | Reject Registration for Past Event | Business Logic / Validation | Event date is prior to current date | Attempt to register for past event | HTTP 400 Bad Request; message "Cannot register for an event that has already passed" | Returns 400, registration blocked | ✅ PASS |
| **TC-REG-06** | EMS-SR-001 | Authentication Enforcement | Security / Access Control | No JWT provided in request header | Send unauthenticated request to `/api/registrations` | HTTP 401 Unauthorized; redirect to `/login` | Returns 401, endpoint protected | ✅ PASS |
| **TC-REG-07** | EMS-F-012 | Retrieve My Registrations Dashboard | Functional / UI | User has registered for events | Access `/my-registrations` or `GET /api/registrations/my-registrations` | HTTP 200 OK; lists user's active/past passes with ticket codes and event details | Returns 200, array of registrations rendered in responsive card grid | ✅ PASS |
| **TC-REG-08** | US-31 | Cancel Registration & Seat Release | Functional / Integration | User has confirmed registration | Click "Cancel Registration" on `/my-registrations` (`PATCH /api/registrations/:id/cancel`) | Status changes to `cancelled`; seat is released for other users; HTTP 200 | Returns 200, status updated to `cancelled`, seat released | ✅ PASS |
| **TC-REG-09** | US-31 | Re-registration After Cancellation | Functional / Lifecycle | User previously cancelled registration | User re-registers for the same event while capacity available | Re-activates registration to `confirmed`, issues new ticket code | Re-activates record to confirmed, new ticket code issued | ✅ PASS |
| **TC-REG-10** | US-30 | Audit Logging for Registration Actions | Compliance / Audit | System active | Create and cancel registrations | AuditLog records created with `REGISTRATION_CREATED` and `REGISTRATION_CANCELLED` | AuditLog table contains actor ID, timestamp, entity ID, metadata | ✅ PASS |

---

## 3. Responsive & Accessibility Testing (US-28 / EMS-NF-005)

- **Mobile Viewport (375px - 767px):** Verified hamburger menu toggle, 1-column card layout, no horizontal overflow (`overflow-x: hidden`).
- **Tablet Viewport (768px - 1023px):** Verified 2-column event grid, side-by-side forms, balanced padding.
- **Desktop Viewport (1024px+):** Verified 3-column event grid, top navigation bar.
- **Accessibility & Keyboard Nav:** All interactive elements (`<button>`, `<Link>`, `<input>`) have visible focus rings (`:focus-visible`), explicit `aria-label` / `aria-expanded` attributes, and semantic landmarks (`<main>`, `<header>`, `<nav>`, `<article>`).

