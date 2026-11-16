const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

/**
 * US-33: Basic Reports API — Summary Report
 * GET /api/reports/summary
 *
 * Scoping & Calculation Rules:
 * - If administrator: global counts across all users, events, and registrations.
 * - If organizer: strictly scoped to events owned by the authenticated organizer.
 *
 * Fill-Rate Calculation Documentation:
 * - Fill rate measures capacity utilization for active/published events where registrations are accepted.
 * - Scope: Filtered strictly to published events within the user's authorization scope.
 * - Numerator: Confirmed registrations for those published events.
 * - Denominator: Total capacity offered by those published events.
 * - Formula: overallFillRatePercent = (publishedConfirmedRegistrations / publishedCapacity) * 100
 * - This guarantees numerator and denominator always use the identical set of events.
 */
const getSummaryReport = async (req, res) => {
    try {
        const isOrganizer = req.user.role === 'organizer';
        const organizerId = req.user.id;

        // Base where clause for event scoping
        const eventWhere = isOrganizer ? { organizerId } : {};

        // 1. User stats (Admins get global user role breakdown; organizers receive null)
        let userStats = null;
        if (!isOrganizer) {
            const [totalUsers, totalParticipants, totalOrganizers, totalAdmins] = await Promise.all([
                User.count(),
                User.count({ where: { role: 'participant' } }),
                User.count({ where: { role: 'organizer' } }),
                User.count({ where: { role: 'administrator' } })
            ]);
            userStats = {
                totalUsers,
                totalParticipants,
                totalOrganizers,
                totalAdmins
            };
        }

        // 2. Event stats (counts by status in authorized scope)
        const [totalEvents, publishedEventsCount, draftEventsCount, cancelledEventsCount] = await Promise.all([
            Event.count({ where: eventWhere }),
            Event.count({ where: { ...eventWhere, status: 'published' } }),
            Event.count({ where: { ...eventWhere, status: 'draft' } }),
            Event.count({ where: { ...eventWhere, status: 'cancelled' } })
        ]);

        // 3. Retrieve all events in the authorized scope to compute registrations and capacity consistently
        const scopedEvents = await Event.findAll({
            where: eventWhere,
            attributes: ['id', 'capacity', 'status']
        });
        const scopedEventIds = scopedEvents.map((e) => e.id);

        let totalCapacity = 0;
        let publishedCapacity = 0;
        const publishedEventIds = [];

        scopedEvents.forEach((e) => {
            const cap = Number(e.capacity) || 0;
            totalCapacity += cap;
            if (e.status === 'published') {
                publishedCapacity += cap;
                publishedEventIds.push(e.id);
            }
        });

        // 4. Registration stats (scoped strictly to the retrieved event IDs)
        let totalRegistrations = 0;
        let confirmedRegistrations = 0;
        let cancelledRegistrations = 0;
        let publishedConfirmedRegistrations = 0;

        if (scopedEventIds.length > 0) {
            [totalRegistrations, confirmedRegistrations, cancelledRegistrations] = await Promise.all([
                Registration.count({ where: { eventId: scopedEventIds } }),
                Registration.count({ where: { eventId: scopedEventIds, status: 'confirmed' } }),
                Registration.count({ where: { eventId: scopedEventIds, status: 'cancelled' } })
            ]);

            if (publishedEventIds.length > 0) {
                publishedConfirmedRegistrations = await Registration.count({
                    where: {
                        eventId: publishedEventIds,
                        status: 'confirmed'
                    }
                });
            }
        }

        // 5. Fill Rate Calculation:
        // Uses publishedConfirmedRegistrations (numerator) and publishedCapacity (denominator)
        // Both strictly share the exact same event scope (publishedEventIds).
        const overallFillRate = publishedCapacity > 0
            ? Math.round((publishedConfirmedRegistrations / publishedCapacity) * 100)
            : 0;

        return res.status(200).json({
            scope: isOrganizer ? 'organizer' : 'global',
            userStats,
            eventStats: {
                totalEvents,
                publishedEvents: publishedEventsCount,
                draftEvents: draftEventsCount,
                cancelledEvents: cancelledEventsCount
            },
            registrationStats: {
                totalRegistrations,
                confirmedRegistrations,
                cancelledRegistrations,
                publishedConfirmedRegistrations,
                totalCapacityOffered: publishedCapacity,
                overallFillRatePercent: overallFillRate
            }
        });
    } catch (error) {
        console.error('Get summary report error:', error);
        return res.status(500).json({
            message: 'Unable to generate summary report'
        });
    }
};

/**
 * US-33: Basic Reports API — Detailed Event Occupancy & Attendance Report
 * GET /api/reports/events
 *
 * Calculates per-event metrics:
 * - Confirmed registrations
 * - Cancelled registrations
 * - Spots remaining: Math.max(0, capacity - confirmed)
 * - Occupancy %: Math.min(100, Math.round((confirmed / capacity) * 100))
 * Numerator and denominator strictly refer to the same event.
 */
const getEventReport = async (req, res) => {
    try {
        const isOrganizer = req.user.role === 'organizer';
        const eventWhere = isOrganizer ? { organizerId: req.user.id } : {};

        const events = await Event.findAll({
            where: eventWhere,
            order: [['date', 'ASC'], ['time', 'ASC']]
        });

        const organizerIds = [...new Set(events.map((e) => e.organizerId).filter(Boolean))];
        const organizers = await User.findAll({
            where: { id: organizerIds },
            attributes: ['id', 'name', 'email']
        });
        const organizerMap = new Map();
        organizers.forEach((u) => organizerMap.set(u.id, u));

        // Aggregate registrations per event in a single batch query
        const eventIds = events.map((e) => e.id);
        const registrations = eventIds.length > 0 ? await Registration.findAll({
            where: { eventId: eventIds },
            attributes: ['eventId', 'status']
        }) : [];

        const confirmedCountMap = new Map();
        const cancelledCountMap = new Map();

        registrations.forEach((r) => {
            if (r.status === 'confirmed') {
                confirmedCountMap.set(r.eventId, (confirmedCountMap.get(r.eventId) || 0) + 1);
            } else if (r.status === 'cancelled') {
                cancelledCountMap.set(r.eventId, (cancelledCountMap.get(r.eventId) || 0) + 1);
            }
        });

        const report = events.map((event) => {
            const confirmed = confirmedCountMap.get(event.id) || 0;
            const cancelled = cancelledCountMap.get(event.id) || 0;
            const spotsRemaining = Math.max(0, event.capacity - confirmed);
            const occupancyPercent = event.capacity > 0
                ? Math.min(100, Math.round((confirmed / event.capacity) * 100))
                : 0;

            return {
                id: event.id,
                title: event.title,
                date: event.date,
                time: event.time,
                venue: event.venue,
                capacity: event.capacity,
                status: event.status,
                organizer: organizerMap.get(event.organizerId) || null,
                confirmedRegistrations: confirmed,
                cancelledRegistrations: cancelled,
                spotsRemaining,
                occupancyPercent,
                isFull: confirmed >= event.capacity
            };
        });

        return res.status(200).json({
            count: report.length,
            events: report
        });
    } catch (error) {
        console.error('Get event report error:', error);
        return res.status(500).json({
            message: 'Unable to generate event report'
        });
    }
};

module.exports = {
    getSummaryReport,
    getEventReport
};
