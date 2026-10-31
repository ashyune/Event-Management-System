const express = require('express');
const {
    getAllUsers,
    getAllEvents,
    deleteUser,
    cancelEvent
} = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce authentication & administrator role for all routes in this router
router.use(authenticate, authorizeRoles('administrator'));

// API 1: View all registered users
router.get('/users', getAllUsers);

// API 2: View all events across all statuses
router.get('/events', getAllEvents);

// API 3: Delete user with safety check
router.delete('/users/:userId', deleteUser);

// API 4: Cancel event with administrator override
router.delete('/events/:eventId', cancelEvent);

module.exports = router;

