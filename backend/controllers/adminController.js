const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

/**
 * API 1: View all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Admin get all users error:', error);
        return res.status(500).json({
            message: 'Unable to retrieve users'
        });
    }
};

/**
 * API 2: View all events (all statuses: draft, published, cancelled)
 * GET /api/admin/events
 * Safely looks up organizer info without modifying model files or schemas
 */
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.findAll({
            order: [['createdAt', 'DESC']]
        });

        // Collect unique organizer IDs from the retrieved events
        const organizerIds = [...new Set(events.map((e) => e.organizerId).filter(Boolean))];

        // Fetch organizer details in a single safe query
        const organizers = await User.findAll({
            where: { id: organizerIds },
            attributes: ['id', 'name', 'email']
        });

        const organizerMap = new Map();
        organizers.forEach((user) => {
            organizerMap.set(user.id, user);
        });

        // Attach organizer details to each event object
        const eventsWithOrganizer = events.map((event) => {
            const plainEvent = event.toJSON();
            plainEvent.organizer = organizerMap.get(event.organizerId) || null;
            return plainEvent;
        });

        return res.status(200).json({
            count: eventsWithOrganizer.length,
            events: eventsWithOrganizer
        });
    } catch (error) {
        console.error('Admin get all events error:', error);
        return res.status(500).json({
            message: 'Unable to retrieve events'
        });
    }
};

/**
 * API 3: Delete user with safety and foreign-key checks
 * DELETE /api/admin/users/:userId
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const targetUserId = Number(userId);

        if (!Number.isSafeInteger(targetUserId) || targetUserId < 1) {
            return res.status(400).json({
                message: 'Invalid user ID provided'
            });
        }

        // Prevent self-deletion by administrator
        if (Number(req.user.id) === targetUserId) {
            return res.status(400).json({
                message: 'Administrators cannot delete their own account'
            });
        }

        const user = await User.findByPk(targetUserId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Safety check: verify if user owns events
        const organizedEventsCount = await Event.count({
            where: { organizerId: targetUserId }
        });

        // Safety check: verify if user has active or past registrations
        const registrationsCount = await Registration.count({
            where: { userId: targetUserId }
        });

        if (organizedEventsCount > 0 || registrationsCount > 0) {
            return res.status(409).json({
                message: 'Cannot safely delete user: associated event or registration records exist',
                details: {
                    organizedEvents: organizedEventsCount,
                    registrations: registrationsCount
                }
            });
        }

        await user.destroy();

        return res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Admin delete user error:', error);

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({
                message: 'Cannot delete user due to existing foreign key dependencies in the database'
            });
        }

        return res.status(500).json({
            message: 'Unable to delete user'
        });
    }
};

/**
 * API 4: Cancel event with administrative override
 * DELETE /api/admin/events/:eventId
 */
const cancelEvent = async (req, res) => {
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

        if (event.status === 'cancelled') {
            return res.status(400).json({
                message: 'Event is already cancelled',
                event
            });
        }

        // Safely cancel event to preserve registration records
        event.status = 'cancelled';
        await event.save();

        return res.status(200).json({
            message: 'Event cancelled successfully by administrator',
            event
        });
    } catch (error) {
        console.error('Admin cancel event error:', error);
        return res.status(500).json({
            message: 'Unable to cancel event'
        });
    }
};

module.exports = {
    getAllUsers,
    getAllEvents,
    deleteUser,
    cancelEvent
};

