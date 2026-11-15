const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

const getEventParticipants = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const parsedEventId = Number(eventId);

        if (!Number.isSafeInteger(parsedEventId) || parsedEventId < 1) {
            return res.status(400).json({
                message: 'Invalid event ID provided'
            });
        }

        const event = await Event.findByPk(parsedEventId);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        const isAdmin = req.user.role === 'administrator';
        const isOwnerOrganizer =
            req.user.role === 'organizer' &&
            Number(event.organizerId) === Number(req.user.id);

        if (!isAdmin && !isOwnerOrganizer) {
            return res.status(403).json({
                message: 'You are not authorized to view participants for this event'
            });
        }

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
        return next(error);
    }
};

module.exports = {
    getEventParticipants
};