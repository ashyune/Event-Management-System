const express = require('express');
const { getEventParticipants } = require('../controllers/organizerController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * US-15: Organizer Participant List Route
 * GET /api/events/:eventId/participants
 *
 * Authentication: Required (JWT)
 * Role Authorization: Accessible to 'organizer' and 'administrator'.
 * Fine-grained ownership check is enforced within getEventParticipants.
 */
router.get(
    '/:eventId/participants',
    authenticate,
    authorizeRoles('organizer', 'administrator'),
    getEventParticipants
);

module.exports = router;

