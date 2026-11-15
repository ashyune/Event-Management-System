const express = require('express');
const {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration,
    getEventRegistrationStatus
} = require('../controllers/registrationController');

const {
    registrationInputValidation,
    registrationIdValidation,
    registrationEventIdValidation
} = require('../middleware/validationMiddleware');

const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, registrationInputValidation, registerForEvent);
router.get('/my-registrations', authenticate, getMyRegistrations);
router.patch('/:registrationId/cancel', authenticate, registrationIdValidation, cancelRegistration);
router.get('/event/:eventId/status', authenticate, registrationEventIdValidation, getEventRegistrationStatus);

module.exports = router;

