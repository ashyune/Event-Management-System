# Event Module Test Report

## Project
Event Management System

## User Story
US-25 – Event Module Test Cases

## Testing Framework
- Jest
- Supertest (available in the backend project)

## Test Execution

Command:
```bash
npm test
```

Result:
- Test suites passed: 4
- Total test suites: 4
- Tests passed: 36
- Total tests: 36

## Event Module Coverage

The event module tests cover:

1. Successful event creation.
2. Rejection of event creation with missing required fields.
3. Rejection of events with past dates.
4. Successful event updates.
5. Unauthorized event update prevention.
6. Handling of nonexistent events.
7. Rejection of empty event updates.
8. Publishing draft events.
9. Cancelling published events.
10. Preventing republishing of published events.
11. Retrieving published events.
12. Handling an empty published-event list.

## Known Limitation – TC-SEARCH-01

Event search functionality is not currently exposed through the inspected backend event routes or controller.

Therefore, TC-SEARCH-01 could not be executed as a functional search test. Search functionality requires implementation before this test can be completed.

## Conclusion

The existing backend test suite completed successfully with 36 passing tests across 4 test suites. The event module tests passed. Event search remains an outstanding requirement.
