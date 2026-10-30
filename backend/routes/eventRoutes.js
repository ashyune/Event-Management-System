
const express = require('express');
const { createEvent } = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authenticate, authorizeRoles('organizer'), createEvent);

module.exports = router;
