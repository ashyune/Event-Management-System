# Event Audit Logging Test Report

## Issue
US-26 – AuditLog model and logging for create, edit, publish, and cancel event actions.

## Objective
Verify that event-related actions are recorded in the AuditLog table and that rejected operations do not create audit records.

## Test Coverage

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| EA-01 | Create an event | Audit record created |
| EA-02 | Create an event with invalid data | No audit record created |
| EA-03 | Update an event | Audit record created |
| EA-04 | Unauthorized event update | No audit record created |
| EA-05 | Publish a draft event | Audit record created |
| EA-06 | Publish an already published event | No audit record created |
| EA-07 | Cancel an event | Audit record created |
| EA-08 | Unauthorized event cancellation | No audit record created |
| EA-09 | Audit logging database failure | Error passed to error middleware |

## Audit Actions

- `EVENT_CREATED`
- `EVENT_UPDATED`
- `EVENT_PUBLISHED`
- `EVENT_CANCELLED`

Each audit record captures the user ID, action, affected event ID, entity type, and relevant metadata.

## Test Execution

Command:

```bash
npm test
```

**Result:** All backend test suites passed.

The dedicated audit tests were also executed using:

```bash
npm test -- --runTestsByPath tests/eventAudit.test.js
```

**Result:** 9 out of 9 audit tests passed.

## Conclusion

The event audit logging functionality passed the automated tests. Successful event operations are recorded, rejected operations do not generate audit records, and audit logging errors are forwarded to the error-handling middleware.