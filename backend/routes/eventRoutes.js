
const express = require('express');
const { createEvent, updateEvent } = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authenticate, authorizeRoles('organizer'), createEvent);
router.put('/:eventId', authenticate, authorizeRoles('organizer', 'admin'), updateEvent);

module.exports = router;
