/**
 * Reports & Analytics Automated Test Suite (US-33, US-35)
 * Sprint 2 — Atharv Kulkarni (Issue #35: Test Suite Refactoring)
 *
 * Verifies:
 * - TC-REP-01: Correct report calculations, scoping, and fill-rate precision (EMS-F-015)
 *
 * SAFETY:
 * All database operations are mocked using Jest test doubles (jest.spyOn).
 * Zero live queries or destructive mutations are executed against the development database.
 */

const { getSummaryReport, getEventReport } = require('../controllers/reportController');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

describe('TC-REP-01: Report Calculations & Role Scoping', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('TC-REP-01a: should compute global metrics and fill-rate for administrator (getSummaryReport)', async () => {
        jest.spyOn(User, 'count').mockImplementation(async (opts) => {
            if (!opts || !opts.where) return 15;
            if (opts.where.role === 'participant') return 10;
            if (opts.where.role === 'organizer') return 3;
            if (opts.where.role === 'administrator') return 2;
            return 0;
        });

        jest.spyOn(Event, 'count').mockImplementation(async (opts) => {
            if (opts?.where?.status === 'published') return 2;
            if (opts?.where?.status === 'draft') return 1;
            if (opts?.where?.status === 'cancelled') return 0;
            return 3;
        });

        jest.spyOn(Event, 'findAll').mockResolvedValue([
            { id: 1, capacity: 50, status: 'published' },
            { id: 2, capacity: 50, status: 'published' },
            { id: 3, capacity: 20, status: 'draft' }
        ]);

        jest.spyOn(Registration, 'count').mockImplementation(async (opts) => {
            if (opts?.where?.status === 'confirmed') return 70;
            if (opts?.where?.status === 'cancelled') return 5;
            return 75;
        });

        const req = { user: { id: 1, role: 'administrator' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getSummaryReport(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.scope).toBe('global');
        expect(responseData.userStats).toEqual({
            totalUsers: 15,
            totalParticipants: 10,
            totalOrganizers: 3,
            totalAdmins: 2
        });
        expect(responseData.eventStats.totalEvents).toBe(3);
        expect(responseData.registrationStats.totalCapacityOffered).toBe(100);
        expect(responseData.registrationStats.overallFillRatePercent).toBe(70); // 70 confirmed / 100 capacity * 100
    });

    it('TC-REP-01b: should isolate stats to owned events and set userStats to null for organizer', async () => {
        const organizerId = 2;

        jest.spyOn(Event, 'count').mockImplementation(async (opts) => {
            expect(opts.where.organizerId).toBe(organizerId);
            if (opts.where.status === 'published') return 1;
            return 1;
        });

        jest.spyOn(Event, 'findAll').mockImplementation(async (opts) => {
            expect(opts.where.organizerId).toBe(organizerId);
            return [{ id: 5, capacity: 40, status: 'published' }];
        });

        jest.spyOn(Registration, 'count').mockImplementation(async (opts) => {
            if (opts?.where?.status === 'confirmed') return 20;
            return 20;
        });

        const req = { user: { id: organizerId, role: 'organizer' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getSummaryReport(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.scope).toBe('organizer');
        expect(responseData.userStats).toBeNull();
        expect(responseData.registrationStats.totalCapacityOffered).toBe(40);
        expect(responseData.registrationStats.overallFillRatePercent).toBe(50); // 20 confirmed / 40 capacity * 100
    });

    it('TC-REP-01c: should safely return 0% fill rate when total published capacity is 0', async () => {
        jest.spyOn(User, 'count').mockResolvedValue(5);
        jest.spyOn(Event, 'count').mockResolvedValue(0);
        jest.spyOn(Event, 'findAll').mockResolvedValue([]);
        jest.spyOn(Registration, 'count').mockResolvedValue(0);

        const req = { user: { id: 1, role: 'administrator' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getSummaryReport(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.registrationStats.totalCapacityOffered).toBe(0);
        expect(responseData.registrationStats.overallFillRatePercent).toBe(0);
    });

    it('TC-REP-01d: should calculate per-event attendance metrics accurately in getEventReport', async () => {
        jest.spyOn(Event, 'findAll').mockResolvedValue([
            {
                id: 1,
                title: 'Data Science Summit',
                date: '2026-12-01',
                time: '10:00:00',
                venue: 'Auditorium A',
                capacity: 50,
                status: 'published',
                organizerId: 2
            }
        ]);

        jest.spyOn(User, 'findAll').mockResolvedValue([
            { id: 2, name: 'Alice Organizer', email: 'alice@ems.local' }
        ]);

        jest.spyOn(Registration, 'findAll').mockResolvedValue([
            { eventId: 1, status: 'confirmed' },
            { eventId: 1, status: 'confirmed' },
            { eventId: 1, status: 'cancelled' }
        ]);

        const req = { user: { id: 2, role: 'organizer' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getEventReport(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.count).toBe(1);
        const eventItem = responseData.events[0];
        expect(eventItem.id).toBe(1);
        expect(eventItem.confirmedRegistrations).toBe(2);
        expect(eventItem.cancelledRegistrations).toBe(1);
        expect(eventItem.spotsRemaining).toBe(48); // 50 capacity - 2 confirmed
        expect(eventItem.occupancyPercent).toBe(4); // (2 / 50) * 100
        expect(eventItem.isFull).toBe(false);
        expect(eventItem.organizer).toEqual(expect.objectContaining({ name: 'Alice Organizer' }));
    });
});
