const { Op } = require('sequelize');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');
const Registration = require('../models/Registration');

const writeAuditLog = async (userId, action, event, metadata = {}) => {
    try {
        await AuditLog.create({
            userId,
            action,
            entityId: event.id,
            entityType: 'event',
            metadata
        });
    } catch (error) {
        console.error('[AuditLog] Failed to write event audit entry:', error.message);
        throw error;
    }
};
const createEvent = async (req, res, next) => {
    try {
        const { title, description, date, time, venue, capacity } = req.body;

        if (
            typeof title !== 'string' ||
            !title.trim() ||
            typeof date !== 'string' ||
            !date.trim() ||
            typeof time !== 'string' ||
            !time.trim() ||
            typeof venue !== 'string' ||
            !venue.trim() ||
            capacity === undefined ||
            capacity === null ||
            capacity === ''
        ) {
            return res.status(400).json({
                message: 'Title, date, time, venue and capacity are required'
            });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: 'Date must use YYYY-MM-DD format'
            });
        }

        const [year, month, day] = date.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (
            eventDate.getFullYear() !== year ||
            eventDate.getMonth() !== month - 1 ||
            eventDate.getDate() !== day ||
            eventDate < today
        ) {
            return res.status(400).json({
                message: 'Event date must be a valid date that is not in the past'
            });
        }

        if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time)) {
            return res.status(400).json({
                message: 'Time must use HH:MM or HH:MM:SS format'
            });
        }

        const parsedCapacity = Number(capacity);

        if (!Number.isSafeInteger(parsedCapacity) || parsedCapacity < 1) {
            return res.status(400).json({
                message: 'Capacity must be a positive integer'
            });
        }

        const event = await Event.create({
            title: title.trim(),
            description: typeof description === 'string' ? description.trim() : null,
            date,
            time,
            venue: venue.trim(),
            capacity: parsedCapacity,
            status: 'draft',
            organizerId: req.user.id
        });

        await writeAuditLog(req.user.id, 'EVENT_CREATED', event, {
            title: event.title,
            status: event.status
        });

        return res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeDatabaseError'
        ) {
            return res.status(400).json({
                message: 'Invalid event data'
            });
        }

        return next(error);
    }
};

const updateEvent = async (req, res, next) => {
    try {
        const event = await Event.findByPk(req.params.eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (
            req.user.role !== 'administrator' &&
            Number(event.organizerId) !== Number(req.user.id)
        ) {
            return res.status(403).json({
                message: 'You are not authorized to edit this event'
            });
        }

        const allowedFields = [
            'title',
            'description',
            'date',
            'time',
            'venue',
            'capacity'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: 'At least one editable field is required'
            });
        }

        if (
            'title' in updates &&
            (typeof updates.title !== 'string' || !updates.title.trim())
        ) {
            return res.status(400).json({
                message: 'Title must be a non-empty string'
            });
        }

        if (
            'description' in updates &&
            updates.description !== null &&
            typeof updates.description !== 'string'
        ) {
            return res.status(400).json({
                message: 'Description must be a string or null'
            });
        }

        if (
            'venue' in updates &&
            (typeof updates.venue !== 'string' || !updates.venue.trim())
        ) {
            return res.status(400).json({
                message: 'Venue must be a non-empty string'
            });
        }

        if ('date' in updates) {
            if (
                typeof updates.date !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(updates.date)
            ) {
                return res.status(400).json({
                    message: 'Date must use YYYY-MM-DD format'
                });
            }

            const [year, month, day] = updates.date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);
            const today = new Date();

            today.setHours(0, 0, 0, 0);

            if (
                eventDate.getFullYear() !== year ||
                eventDate.getMonth() !== month - 1 ||
                eventDate.getDate() !== day ||
                eventDate < today
            ) {
                return res.status(400).json({
                    message: 'Event date must be a valid date that is not in the past'
                });
            }
        }

        if (
            'time' in updates &&
            (
                typeof updates.time !== 'string' ||
                !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(updates.time)
            )
        ) {
            return res.status(400).json({
                message: 'Time must use HH:MM or HH:MM:SS format'
            });
        }

        if ('capacity' in updates) {
            const capacity = Number(updates.capacity);

            if (
                updates.capacity === '' ||
                updates.capacity === null ||
                !Number.isSafeInteger(capacity) ||
                capacity < 1
            ) {
                return res.status(400).json({
                    message: 'Capacity must be a positive integer'
                });
            }

            updates.capacity = capacity;
        }

        if ('title' in updates) {
            updates.title = updates.title.trim();
        }

        if ('venue' in updates) {
            updates.venue = updates.venue.trim();
        }

        if ('description' in updates && typeof updates.description === 'string') {
            updates.description = updates.description.trim();
        }

        await event.update(updates);

        await writeAuditLog(req.user.id, 'EVENT_UPDATED', event, {
            changedFields: Object.keys(updates)
        });

        return res.status(200).json({
            message: 'Event updated successfully',
            event
        });
    } catch (error) {
        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeDatabaseError'
        ) {
            return res.status(400).json({
                message: 'Invalid event data'
            });
        }

        return next(error);
    }
};

const updateEventStatus = async (req, res, next, newStatus) => {
    try {
        const event = await Event.findByPk(req.params.eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        if (
            req.user.role !== 'administrator' &&
            Number(event.organizerId) !== Number(req.user.id)
        ) {
            return res.status(403).json({
                message: 'You are not authorized to change this event status'
            });
        }

        if (event.status === 'cancelled') {
            return res.status(400).json({
                message: 'A cancelled event cannot change status'
            });
        }

        if (newStatus === 'published' && event.status !== 'draft') {
            return res.status(400).json({
                message: 'Only draft events can be published'
            });
        }

        event.status = newStatus;
        await event.save();

        const action = newStatus === 'published'
            ? 'EVENT_PUBLISHED'
            : 'EVENT_CANCELLED';

        await writeAuditLog(req.user.id, action, event, {
            status: newStatus
        });

        return res.status(200).json({
            message: `Event ${newStatus} successfully`,
            event
        });
    } catch (error) {
        return next(error);
    }
};

const publishEvent = async (req, res, next) => {
    return updateEventStatus(req, res, next, 'published');
};

const cancelEvent = async (req, res, next) => {
    return updateEventStatus(req, res, next, 'cancelled');
};

const getPublishedEvents = async (req, res, next) => {
    try {
        const { keyword, date, status } = req.query;

        const where = {
            status: 'published'
        };

        if (keyword && keyword.trim()) {
            where[Op.or] = [
                { title: { [Op.iLike]: `%${keyword.trim()}%` } },
                { description: { [Op.iLike]: `%${keyword.trim()}%` } },
                { venue: { [Op.iLike]: `%${keyword.trim()}%` } }
            ];
        }

        if (date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({
                    message: 'Date must use YYYY-MM-DD format'
                });
            }

            where.date = date;
        }

        if (status && status !== 'published') {
            return res.status(400).json({
                message: 'Only published events are available in public event search'
            });
        }

        const events = await Event.findAll({
            where,
            attributes: [
                'id',
                'title',
                'description',
                'date',
                'time',
                'venue',
                'capacity',
                'status',
                'organizerId',
                'createdAt'
            ],
            order: [
                ['date', 'ASC'],
                ['time', 'ASC']
            ]
        });

        return res.status(200).json({
            count: events.length,
            events
        });
    } catch (error) {
        return next(error);
    }
};

const getEventById = async (req, res, next) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isSafeInteger(eventId) || eventId < 1) {
            return res.status(400).json({
                message: 'Invalid event ID'
            });
        }

        const event = await Event.findByPk(eventId);

        if (!event || event.status !== 'published') {
            return res.status(404).json({
                message: 'Published event not found'
            });
        }

        const confirmedCount = await Registration.count({
            where: {
                eventId: event.id,
                status: 'confirmed'
            }
        });

        const seatsAvailable = Math.max(
            0,
            event.capacity - confirmedCount
        );

        return res.status(200).json({
            event: {
                ...event.toJSON(),
                confirmedRegistrations: confirmedCount,
                seatsAvailable
            }
        });
    } catch (error) {
        return next(error);
    }
};

const getMyEvents = async (req, res, next) => {
    try {
        const events = await Event.findAll({
            where: {
                organizerId: req.user.id
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });

        return res.status(200).json({
            count: events.length,
            events
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createEvent,
    updateEvent,
    publishEvent,
    cancelEvent,
    getPublishedEvents,
    getEventById,
    getMyEvents
};