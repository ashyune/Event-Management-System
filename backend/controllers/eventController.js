const Event = require('../models/Event');

const createEvent = async (req, res) => {
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

        return res.status(201).json({
            message: 'Event created successfully',
            event
        });
    } catch (error) {
        console.error('Create event error:', error);

        if (
            error.name === 'SequelizeValidationError' ||
            error.name === 'SequelizeDatabaseError'
        ) {
            return res.status(400).json({
                message: 'Invalid event data'
            });
        }

        return res.status(500).json({
            message: 'Unable to create event'
        });
    }
};

module.exports = { createEvent };