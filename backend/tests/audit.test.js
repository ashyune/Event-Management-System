/**
 * Audit Logging Automated Test Suite (US-36, US-35)
 * Sprint 2 — Atharv Kulkarni (Issue #35: Test Suite Refactoring)
 *
 * Verifies:
 * - TC-AUD-01: Audit log creation on critical administrative actions and action filtering (EMS-SR-002, US-36)
 *
 * SAFETY:
 * All database operations are mocked using Jest test doubles (jest.spyOn).
 * Zero live queries or destructive mutations are executed against the development database.
 */

const {
    cancelEvent,
    deleteUser,
    getAuditLogs
} = require('../controllers/adminController');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const AuditLog = require('../models/AuditLog');

describe('TC-AUD-01: Audit Log Creation & Action Filtering', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('TC-AUD-01a: should record EVENT_CANCELLED audit entry when administrator cancels an event', async () => {
        const auditSpy = jest.spyOn(AuditLog, 'create').mockResolvedValue({});
        const mockSave = jest.fn().mockResolvedValue(true);
        jest.spyOn(Event, 'findByPk').mockResolvedValue({
            id: 42,
            title: 'Emergency Cancelled Conference',
            status: 'published',
            save: mockSave
        });

        const req = { params: { eventId: '42' }, user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await cancelEvent(req, res);

        expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
            userId: 1,
            action: 'EVENT_CANCELLED',
            entityId: 42,
            entityType: 'event'
        }));
    });

    it('TC-AUD-01b: should record USER_DELETED audit entry strictly after user.destroy() succeeds', async () => {
        const executionOrder = [];

        const mockDestroy = jest.fn().mockImplementation(async () => {
            executionOrder.push('user.destroy');
            return true;
        });

        const auditSpy = jest.spyOn(AuditLog, 'create').mockImplementation(async () => {
            executionOrder.push('AuditLog.create');
            return {};
        });

        jest.spyOn(User, 'findByPk').mockResolvedValue({
            id: 9,
            name: 'Deleted User',
            email: 'deleted@ems.local',
            destroy: mockDestroy
        });
        jest.spyOn(Event, 'count').mockResolvedValue(0);
        jest.spyOn(Registration, 'count').mockResolvedValue(0);

        const req = { params: { userId: '9' }, user: { id: 1 } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await deleteUser(req, res);

        expect(mockDestroy).toHaveBeenCalledTimes(1);
        expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
            userId: 1,
            action: 'USER_DELETED',
            entityId: 9,
            entityType: 'user'
        }));
        expect(executionOrder).toEqual(['user.destroy', 'AuditLog.create']);
    });

    it('TC-AUD-01c: should retrieve audit logs and apply action filtering in getAuditLogs', async () => {
        const mockLogs = [
            {
                id: 1,
                userId: 1,
                action: 'EVENT_CANCELLED',
                entityId: 10,
                entityType: 'event',
                createdAt: new Date(),
                toJSON: () => ({ id: 1, userId: 1, action: 'EVENT_CANCELLED', entityId: 10, entityType: 'event' })
            }
        ];

        jest.spyOn(AuditLog, 'findAll').mockImplementation(async (opts) => {
            expect(opts.where).toEqual({ action: 'EVENT_CANCELLED' });
            return mockLogs;
        });
        jest.spyOn(User, 'findAll').mockResolvedValue([
            { id: 1, name: 'Admin', email: 'admin@ems.local', role: 'administrator' }
        ]);

        const req = { query: { action: 'EVENT_CANCELLED' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getAuditLogs(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            count: 1,
            auditLogs: [
                expect.objectContaining({
                    action: 'EVENT_CANCELLED',
                    actor: expect.objectContaining({ name: 'Admin' })
                })
            ]
        }));
    });
});
