const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

/**
 * US-15: Organizer Participant List API
 * GET /api/events/:eventId/participants
 *
 * Requirements:
 * - Only the event owner (organizer who created the event) or an administrator can view its participants.
 * - Other organizers must receive 403 Forbidden.
 * - Regular participants must receive 403 Forbidden.
 * - Missing authentication must return 401 Unauthorized.
 * - Non-existent event must return 404 Not Found.
 * - Returns participant name, email, registration date, ticket code and registration status.
 */
const getEventParticipants = async (req, res) => {
    try {
        const { eventId } = req.params;
        const parsedEventId = Number(eventId);

        if (!Number.isSafeInteger(parsedEventId) || parsedEventId < 1) {
            return res.status(400).json({
                message: 'Invalid event ID provided'
            });
        }

        // 1. Fetch the event
        const event = await Event.findByPk(parsedEventId);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        // 2. Enforce ownership and role permissions:
        // Allowed: administrator OR the organizer who created this specific event.
        const isAdmin = req.user.role === 'administrator';
        const isOwnerOrganizer = req.user.role === 'organizer' && Number(event.organizerId) === Number(req.user.id);

        if (!isAdmin && !isOwnerOrganizer) {
            return res.status(403).json({
                message: 'You are not authorized to view participants for this event'
            });
        }

        // 3. Fetch all registrations for this event with attendee user details
        const registrations = await Registration.findAll({
            where: {
                eventId: parsedEventId
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [
                ['registrationDate', 'ASC']
            ]
        });

        // 4. Map into a clean, simple participant list
        const participants = registrations.map((reg) => ({
            registrationId: reg.id,
            userId: reg.user ? reg.user.id : reg.userId,
            name: reg.user ? reg.user.name : 'Unknown',
            email: reg.user ? reg.user.email : 'Unknown',
            registrationDate: reg.registrationDate,
            ticketCode: reg.ticketCode,
            status: reg.status
        }));

        return res.status(200).json({
            eventId: event.id,
            eventTitle: event.title,
            capacity: event.capacity,
            totalParticipants: participants.length,
            participants
        });

    } catch (error) {
        console.error('Get event participants error:', error);
        return res.status(500).json({
            message: 'Unable to retrieve participant list'
        });
    }
};

module.exports = {
    getEventParticipants
};

