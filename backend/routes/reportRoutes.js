const express = require('express');
const { getSummaryReport, getEventReport } = require('../controllers/reportController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

// Enforce authentication & role check (administrator or organizer)
router.use(authenticate, authorizeRoles('administrator', 'organizer'));

// GET /api/reports/summary — Aggregate high-level system metrics
router.get('/summary', getSummaryReport);

// GET /api/reports/events — Event-by-event occupancy & registration metrics
router.get('/events', getEventReport);

module.exports = router;
