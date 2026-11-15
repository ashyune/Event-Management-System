/**
 * Administrator Module Automated Test Suite (US-32, US-35)
 * Sprint 2 — Atharv Kulkarni (Issue #35: Test Suite Refactoring)
 *
 * Verifies:
 * - TC-ADM-01: Administrator authorization, authentication middleware, and management APIs (EMS-SR-001, EMS-SR-002, EMS-F-013, EMS-F-014)
 *
 * SAFETY:
 * All database operations are mocked using Jest test doubles (jest.spyOn).
 * Zero live queries or destructive mutations are executed against the development database.
 */

const {
    getAllUsers,
    getAllEvents,
    deleteUser,
    cancelEvent
} = require('../controllers/adminController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AuditLog = require('../models/AuditLog');

describe('TC-ADM-01: Administrator Authorization & Management APIs', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('TC-ADM-01a: should reject unauthenticated requests with 401 when Authorization header is missing', () => {
        const req = { headers: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authentication required'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-ADM-01b: should reject non-administrator roles with 403 when accessing protected admin routes', () => {
        const req = { user: { id: 2, role: 'participant' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        const adminRoleGuard = authorizeRoles('administrator');
        adminRoleGuard(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Access forbidden'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('TC-ADM-01c: should allow access when user possesses the administrator role', () => {
        const req = { user: { id: 1, role: 'administrator' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        const adminRoleGuard = authorizeRoles('administrator');
        adminRoleGuard(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('TC-ADM-01d: should retrieve all users with sanitized fields and count (getAllUsers)', async () => {
        const mockUsers = [
            { id: 1, name: 'Admin User', email: 'admin@ems.local', role: 'administrator', createdAt: new Date() },
            { id: 2, name: 'Organizer User', email: 'organizer@ems.local', role: 'organizer', createdAt: new Date() }
        ];
        jest.spyOn(User, 'findAll').mockResolvedValue(mockUsers);

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getAllUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            count: 2,
            users: mockUsers
        });
    });

    it('TC-ADM-01e: should retrieve all events with joined organizer details (getAllEvents)', async () => {
        const mockEvents = [
            {
                id: 10,
                title: 'Cloud Summit',
                organizerId: 2,
                status: 'published',
                toJSON: () => ({ id: 10, title: 'Cloud Summit', organizerId: 2, status: 'published' })
            }
        ];
        const mockOrganizers = [
            { id: 2, name: 'Tech Lead', email: 'techlead@ems.local' }
        ];

        jest.spyOn(Event, 'findAll').mockResolvedValue(mockEvents);
        jest.spyOn(User, 'findAll').mockResolvedValue(mockOrganizers);

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getAllEvents(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            count: 1,
            events: [
                expect.objectContaining({
                    id: 10,
                    title: 'Cloud Summit',
                    organizer: expect.objectContaining({ id: 2, name: 'Tech Lead' })
                })
            ]
        });
    });

    it('TC-ADM-01f: should reject invalid or non-integer user IDs on deletion with 400 (deleteUser)', async () => {
        const req = { params: { userId: 'invalid-id' }, user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await deleteUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid user ID provided'
        });
    });

    it('TC-ADM-01g: should prevent administrator from deleting their own account with 400 (deleteUser)', async () => {
        const req = { params: { userId: '1' }, user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await deleteUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Administrators cannot delete their own account'
        });
    });

    it('TC-ADM-01h: should reject user deletion with HTTP 409 Conflict if associated events or registrations exist', async () => {
        jest.spyOn(User, 'findByPk').mockResolvedValue({
            id: 5,
            name: 'Key Organizer',
            email: 'keyorg@ems.local'
        });
        jest.spyOn(Event, 'count').mockResolvedValue(3);
        jest.spyOn(Registration, 'count').mockResolvedValue(0);

        const req = { params: { userId: '5' }, user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await deleteUser(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Cannot safely delete user: associated event or registration records exist',
            details: {
                organizedEvents: 3,
                registrations: 0
            }
        }));
    });

    it('TC-ADM-01i: should allow administrator to cancel an event and set status to cancelled (cancelEvent)', async () => {
        const mockSave = jest.fn().mockResolvedValue(true);
        const mockEvent = {
            id: 20,
            title: 'AI Symposium',
            status: 'published',
            save: mockSave
        };
        jest.spyOn(Event, 'findByPk').mockResolvedValue(mockEvent);
        jest.spyOn(AuditLog, 'create').mockResolvedValue({});

        const req = { params: { eventId: '20' }, user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await cancelEvent(req, res);

        expect(mockEvent.status).toBe('cancelled');
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Event cancelled successfully by administrator'
        }));
    });
});
