const express = require('express');
const {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration,
    getEventRegistrationStatus
} = require('../controllers/registrationController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

// Register for an event (EMS-F-009, EMS-F-010, EMS-F-011)
router.post('/', authenticate, registerForEvent);

// View attendee's registered events (EMS-F-012)
router.get('/my-registrations', authenticate, getMyRegistrations);

// Cancel a registration
router.patch('/:registrationId/cancel', authenticate, cancelRegistration);

// Check registration status and seat capacity for a specific event
router.get('/event/:eventId/status', authenticate, getEventRegistrationStatus);

module.exports = router;

