const express = require('express');

const {
    createEventValidation,
    updateEventValidation,
    eventIdValidation
} = require('../middleware/validationMiddleware');

const {
    createEvent,
    updateEvent,
    publishEvent,
    cancelEvent,
    getPublishedEvents,
    getEventById
} = require('../controllers/eventController');

const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getPublishedEvents);
router.get('/:id', getEventById);

router.post(
    '/',
    authenticate,
    authorizeRoles('organizer'),
    createEventValidation,
    createEvent
);

router.put(
    '/:eventId',
    authenticate,
    authorizeRoles('organizer', 'administrator'),
    updateEventValidation,
    updateEvent
);

router.patch(
    '/:eventId/publish',
    authenticate,
    authorizeRoles('organizer', 'administrator'),
    eventIdValidation,
    publishEvent
);

router.patch(
    '/:eventId/cancel',
    authenticate,
    authorizeRoles('organizer', 'administrator'),
    eventIdValidation,
    cancelEvent
);

module.exports = router;