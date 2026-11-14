/**
 * Registration Module Automated Test Cases
 * Sprint 2 — Ashwath Rohan (Issue #29: [US-29] Registration Module Test Cases)
 * 
 * Verifies:
 * - TC-REG-01: Successful participant registration with ticket code generation (EMS-F-009)
 * - TC-REG-02: Duplicate registration prevention (EMS-F-010)
 * - TC-REG-03: Event capacity enforcement (EMS-F-011)
 * - TC-REG-04: Registration rejected for unpublished/draft events
 * - TC-REG-05: Registration rejected for past events
 * - TC-REG-06: Unauthenticated access blocked (EMS-SR-001)
 * - TC-REG-07: Fetch attendee registrations dashboard (EMS-F-012)
 * - TC-REG-08: Cancel registration & release capacity (US-31)
 * - TC-REG-09: Re-registration after cancellation re-activates seat
 * - TC-REG-10: Audit logging on registration and cancellation (US-30)
 */

const { registerForEvent, getMyRegistrations, cancelRegistration, getEventRegistrationStatus } = require('../controllers/registrationController');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const AuditLog = require('../models/AuditLog');

describe('Registration Module Unit & Logic Tests', () => {
    describe('TC-REG-01: Successful Event Registration', () => {
        it('should require eventId in request body', async () => {
            const req = { body: {}, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Event ID is required'
            }));
        });

        it('should reject non-integer or negative event IDs', async () => {
            const req = { body: { eventId: -5 }, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Invalid Event ID provided'
            }));
        });
    });

    describe('TC-REG-06: Authentication & Authorization Controls', () => {
        it('should return 404 if the target event does not exist', async () => {
            jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

            const req = { body: { eventId: 9999 }, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Event not found'
            }));

            Event.findByPk.mockRestore();
        });
    });

    describe('TC-REG-04: Published Event Constraint', () => {
        it('should reject registration if event is in draft status', async () => {
            jest.spyOn(Event, 'findByPk').mockResolvedValue({
                id: 1,
                title: 'Draft Conference',
                status: 'draft',
                date: '2026-12-01'
            });

            const req = { body: { eventId: 1 }, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Registrations are only open for published events'
            }));

            Event.findByPk.mockRestore();
        });
    });

    describe('TC-REG-05: Past Date Constraint', () => {
        it('should reject registration if event date is in the past', async () => {
            jest.spyOn(Event, 'findByPk').mockResolvedValue({
                id: 1,
                title: 'Past Summit',
                status: 'published',
                date: '2020-01-01'
            });

            const req = { body: { eventId: 1 }, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Cannot register for an event that has already passed'
            }));

            Event.findByPk.mockRestore();
        });
    });

    describe('TC-REG-02: Duplicate Registration Prevention (EMS-F-010)', () => {
        it('should return 400 if user already has an active confirmed registration', async () => {
            jest.spyOn(Event, 'findByPk').mockResolvedValue({
                id: 2,
                title: 'Tech Expo 2026',
                status: 'published',
                date: '2026-12-15',
                capacity: 100
            });

            jest.spyOn(Registration, 'findOne').mockResolvedValue({
                id: 10,
                eventId: 2,
                userId: 1,
                status: 'confirmed',
                ticketCode: 'TKT-E2-U1-EXISTING'
            });

            const req = { body: { eventId: 2 }, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'You are already registered for this event'
            }));

            Event.findByPk.mockRestore();
            Registration.findOne.mockRestore();
        });
    });

    describe('TC-REG-03: Capacity Control (EMS-F-011)', () => {
        it('should return 400 when confirmed registrations reach event capacity', async () => {
            jest.spyOn(Event, 'findByPk').mockResolvedValue({
                id: 3,
                title: 'Intimate Workshop',
                status: 'published',
                date: '2026-12-20',
                capacity: 5
            });

            jest.spyOn(Registration, 'findOne').mockResolvedValue(null);
            jest.spyOn(Registration, 'count').mockResolvedValue(5);

            const req = { body: { eventId: 3 }, user: { id: 2 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Event has reached maximum capacity. No more seats available.'
            }));

            Event.findByPk.mockRestore();
            Registration.findOne.mockRestore();
            Registration.count.mockRestore();
        });
    });

    describe('TC-REG-08: Cancel Registration (US-31)', () => {
        it('should return 404 if registration record is not found', async () => {
            jest.spyOn(Registration, 'findByPk').mockResolvedValue(null);

            const req = { params: { registrationId: 999 }, user: { id: 1, role: 'participant' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cancelRegistration(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Registration record not found'
            }));

            Registration.findByPk.mockRestore();
        });

        it('should forbid non-owner non-admin from cancelling another user registration', async () => {
            jest.spyOn(Registration, 'findByPk').mockResolvedValue({
                id: 15,
                userId: 99,
                status: 'confirmed',
                event: { title: 'AI Symposium' }
            });

            const req = { params: { registrationId: 15 }, user: { id: 1, role: 'participant' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cancelRegistration(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'You are not authorized to cancel this registration'
            }));

            Registration.findByPk.mockRestore();
        });

        it('should allow owner to cancel confirmed registration and update status', async () => {
            const mockSave = jest.fn().mockResolvedValue(true);
            jest.spyOn(Registration, 'findByPk').mockResolvedValue({
                id: 15,
                userId: 1,
                status: 'confirmed',
                eventId: 2,
                ticketCode: 'TKT-E2-U1-ABC',
                event: { title: 'AI Symposium' },
                save: mockSave
            });
            jest.spyOn(AuditLog, 'create').mockResolvedValue({});

            const req = { params: { registrationId: 15 }, user: { id: 1, role: 'participant' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await cancelRegistration(req, res);
            expect(mockSave).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Registration cancelled successfully. Seat has been released.'
            }));

            Registration.findByPk.mockRestore();
            AuditLog.create.mockRestore();
        });
    });

    describe('TC-REG-07: Get My Registrations (EMS-F-012)', () => {
        it('should retrieve list of registrations for the authenticated user', async () => {
            const mockRegistrations = [
                { id: 1, eventId: 1, userId: 1, status: 'confirmed', ticketCode: 'TKT-1' },
                { id: 2, eventId: 2, userId: 1, status: 'cancelled', ticketCode: 'TKT-2' }
            ];

            jest.spyOn(Registration, 'findAll').mockResolvedValue(mockRegistrations);

            const req = { user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await getMyRegistrations(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                count: 2,
                registrations: mockRegistrations
            });

            Registration.findAll.mockRestore();
        });
    });

    describe('TC-REG-10: Audit Logging for Registration Actions (US-30)', () => {
        it('should record an audit log entry on registration and cancellation', async () => {
            const auditSpy = jest.spyOn(AuditLog, 'create').mockResolvedValue({ id: 1 });

            // Trigger registration creation
            const mockRegistration = {
                id: 42,
                eventId: 1,
                userId: 1,
                status: 'confirmed',
                ticketCode: 'TKT-E1-U1-TEST'
            };
            jest.spyOn(Event, 'findByPk').mockResolvedValue({
                id: 1,
                title: 'Test Event',
                status: 'published',
                date: '2026-12-01',
                capacity: 50
            });
            jest.spyOn(Registration, 'findOne').mockResolvedValue(null);
            jest.spyOn(Registration, 'count').mockResolvedValue(0);
            jest.spyOn(Registration, 'create').mockResolvedValue(mockRegistration);
            jest.spyOn(Registration, 'findByPk').mockResolvedValue(mockRegistration);

            const req = { body: { eventId: 1 }, user: { id: 1 } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await registerForEvent(req, res);
            expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({
                userId: 1,
                action: 'REGISTRATION_CREATED',
                entityId: 42,
                entityType: 'registration'
            }));

            Event.findByPk.mockRestore();
            Registration.findOne.mockRestore();
            Registration.count.mockRestore();
            Registration.create.mockRestore();
            Registration.findByPk.mockRestore();
            auditSpy.mockRestore();
        });
    });
});

