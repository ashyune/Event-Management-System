const express = require('express');
const {
    createEvent,
    updateEvent,
    publishEvent,
    cancelEvent,
    getPublishedEvents
} = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', getPublishedEvents);
router.post('/', authenticate, authorizeRoles('organizer'), createEvent);
router.put('/:eventId', authenticate, authorizeRoles('organizer', 'administrator'), updateEvent);
router.patch('/:eventId/publish', authenticate, authorizeRoles('organizer', 'administrator'), publishEvent);
router.patch('/:eventId/cancel', authenticate, authorizeRoles('organizer', 'administrator'), cancelEvent);

module.exports = router;