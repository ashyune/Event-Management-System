
const crypto = require('crypto');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Generate a unique, verifiable ticket code.
 */
const generateTicketCode = (eventId, userId) => {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TKT-E${eventId}-U${userId}-${timestamp}-${randomHex}`;
};

/**
 * Write a structured audit log entry.
 * Failure is non-fatal: it never blocks the main response.
 */
const writeAuditLog = async ({ userId, action, entityId, metadata = {} }) => {
    try {
        await AuditLog.create({
            userId,
            action,
            entityId,
            entityType: 'registration',
            metadata
        });
    } catch (auditErr) {
        console.error('[AuditLog] Failed to write audit entry:', auditErr.message);
    }
};

/**
 * Register for an event.
 * POST /api/registrations
 */
const registerForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            return res.status(400).json({
                message: 'Event ID is required'
            });
        }

        const parsedEventId = Number(eventId);
        if (!Number.isSafeInteger(parsedEventId) || parsedEventId < 1) {
            return res.status(400).json({
                message: 'Invalid Event ID provided'
            });
        }

        const event = await Event.findByPk(parsedEventId);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (event.status !== 'published') {
            return res.status(400).json({
                message: 'Registrations are only open for published events'
            });
        }

        const [year, month, day] = event.date.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            return res.status(400).json({
                message: 'Cannot register for an event that has already passed'
            });
        }

        const existingActiveRegistration = await Registration.findOne({
            where: {
                eventId: parsedEventId,
                userId: req.user.id,
                status: 'confirmed'
            }
        });

        if (existingActiveRegistration) {
            return res.status(400).json({
                message: 'You are already registered for this event',
                ticketCode: existingActiveRegistration.ticketCode,
                registration: existingActiveRegistration
            });
        }

        const confirmedCount = await Registration.count({
            where: {
                eventId: parsedEventId,
                status: 'confirmed'
            }
        });

        if (confirmedCount >= event.capacity) {
            return res.status(400).json({
                message: 'Event has reached maximum capacity. No more seats available.',
                capacity: event.capacity,
                registeredCount: confirmedCount
            });
        }

        const ticketCode = generateTicketCode(parsedEventId, req.user.id);

        const cancelledRegistration = await Registration.findOne({
            where: {
                eventId: parsedEventId,
                userId: req.user.id,
                status: 'cancelled'
            }
        });

        let registration;
        if (cancelledRegistration) {
            cancelledRegistration.status = 'confirmed';
            cancelledRegistration.ticketCode = ticketCode;
            cancelledRegistration.registrationDate = new Date();
            await cancelledRegistration.save();
            registration = cancelledRegistration;
        } else {
            registration = await Registration.create({
                eventId: parsedEventId,
                userId: req.user.id,
                registrationDate: new Date(),
                status: 'confirmed',
                ticketCode
            });
        }

        await writeAuditLog({
            userId: req.user.id,
            action: 'REGISTRATION_CREATED',
            entityId: registration.id,
            metadata: {
                eventId: parsedEventId,
                eventTitle: event.title,
                ticketCode
            }
        });

        const populatedRegistration = await Registration.findByPk(registration.id, {
            include: [
                {
                    model: Event,
                    as: 'event',
                    attributes: ['id', 'title', 'description', 'date', 'time', 'venue', 'capacity', 'status']
                }
            ]
        });

        return res.status(201).json({
            message: 'Registration confirmed successfully',
            registration: populatedRegistration,
            ticketCode
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'You are already registered for this event'
            });
        }

        return next(error);
    }
};

/**
 * Get all registrations for the logged-in user.
 * GET /api/registrations/my-registrations
 */
const getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await Registration.findAll({
            where: {
                userId: req.user.id
            },
            include: [
                {
                    model: Event,
                    as: 'event',
                    attributes: ['id', 'title', 'description', 'date', 'time', 'venue', 'capacity', 'status']
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({
            count: registrations.length,
            registrations
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Cancel a registration.
 * PATCH /api/registrations/:registrationId/cancel
 */
const cancelRegistration = async (req, res, next) => {
    try {
        const { registrationId } = req.params;

        const registration = await Registration.findByPk(registrationId, {
            include: [
                {
                    model: Event,
                    as: 'event',
                    attributes: ['id', 'title', 'date', 'time', 'venue']
                }
            ]
        });

        if (!registration) {
            return res.status(404).json({
                message: 'Registration record not found'
            });
        }

        if (
            req.user.role !== 'administrator' &&
            Number(registration.userId) !== Number(req.user.id)
        ) {
            return res.status(403).json({
                message: 'You are not authorized to cancel this registration'
            });
        }

        if (registration.status === 'cancelled') {
            return res.status(400).json({
                message: 'This registration is already cancelled'
            });
        }

        registration.status = 'cancelled';
        await registration.save();

        await writeAuditLog({
            userId: req.user.id,
            action: 'REGISTRATION_CANCELLED',
            entityId: registration.id,
            metadata: {
                eventId: registration.eventId,
                eventTitle: registration.event ? registration.event.title : null,
                ticketCode: registration.ticketCode
            }
        });

        return res.status(200).json({
            message: 'Registration cancelled successfully. Seat has been released.',
            registration
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Get registration status and seat metrics for an event.
 * GET /api/registrations/event/:eventId/status
 */
const getEventRegistrationStatus = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        const confirmedCount = await Registration.count({
            where: {
                eventId,
                status: 'confirmed'
            }
        });

        let userRegistration = null;
        if (req.user && req.user.id) {
            userRegistration = await Registration.findOne({
                where: {
                    eventId,
                    userId: req.user.id,
                    status: 'confirmed'
                }
            });
        }

        const spotsRemaining = Math.max(0, event.capacity - confirmedCount);

        return res.status(200).json({
            eventId: event.id,
            capacity: event.capacity,
            confirmedCount,
            spotsRemaining,
            isFull: confirmedCount >= event.capacity,
            isRegistered: !!userRegistration,
            ticketCode: userRegistration ? userRegistration.ticketCode : null
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration,
    getEventRegistrationStatus
};
