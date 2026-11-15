const express = require('express');
const {
    getAllUsers,
    getAllEvents,
    deleteUser,
    cancelEvent
} = require('../controllers/adminController');
const {
    userIdValidation,
    eventIdValidation
} = require('../middleware/validationMiddleware');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce authentication & administrator role for all routes in this router
router.use(authenticate, authorizeRoles('administrator'));

// API 1: View all registered users
router.get('/users', getAllUsers);

// API 2: View all events across all statuses
router.get('/events', getAllEvents);

router.delete('/users/:userId', userIdValidation, deleteUser);
router.delete('/events/:eventId', eventIdValidation, cancelEvent);
module.exports = router;

