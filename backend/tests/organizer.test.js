/**
 * Organizer Participant Management Automated Test Suite (US-15, US-34, US-35)
 * Sprint 2 — Atharv Kulkarni (Issue #35: Test Suite Refactoring)
 *
 * Verifies:
 * - TC-ORG-01: Organizer participant access and ownership scoping (EMS-SR-001, EMS-SR-002, EMS-F-015)
 *
 * SAFETY:
 * All database operations are mocked using Jest test doubles (jest.spyOn).
 * Zero live queries or destructive mutations are executed against the development database.
 */

const { getEventParticipants } = require('../controllers/organizerController');

const Event = require('../models/Event');
const Registration = require('../models/Registration');

describe('TC-ORG-01: Organizer Participant Access & Ownership Scoping', () => {

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('TC-ORG-01a: should return 400 for invalid or non-integer event ID (getEventParticipants)', async () => {
        const req = { params: { eventId: 'abc' }, user: { id: 2, role: 'organizer' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getEventParticipants(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid event ID provided'
        });
    });

    it('TC-ORG-01b: should return 404 when target event does not exist (getEventParticipants)', async () => {
        jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

        const req = { params: { eventId: '9999' }, user: { id: 2, role: 'organizer' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getEventParticipants(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Event not found'
        });
    });

    it('TC-ORG-01c: should forbid non-owner organizers from viewing participants for events they do not own (403)', async () => {
        jest.spyOn(Event, 'findByPk').mockResolvedValue({
            id: 10,
            title: 'Aryan Event',
            organizerId: 99
        });

        const req = { params: { eventId: '10' }, user: { id: 2, role: 'organizer' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getEventParticipants(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'You are not authorized to view participants for this event'
        });
    });

    it('TC-ORG-01d: should permit event owner organizer to view attendee list with ticket codes and statuses', async () => {
        const regDate = new Date();
        jest.spyOn(Event, 'findByPk').mockResolvedValue({
            id: 10,
            title: 'Hackathon 2026',
            capacity: 100,
            organizerId: 2
        });

        jest.spyOn(Registration, 'findAll').mockResolvedValue([
            {
                id: 101,
                userId: 7,
                ticketCode: 'TKT-E10-U7-XYZ',
                status: 'confirmed',
                registrationDate: regDate,
                user: { id: 7, name: 'Alice Smith', email: 'alice@ems.local' }
            }
        ]);

        const req = { params: { eventId: '10' }, user: { id: 2, role: 'organizer' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getEventParticipants(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            eventId: 10,
            eventTitle: 'Hackathon 2026',
            capacity: 100,
            totalParticipants: 1,
            participants: [
                {
                    registrationId: 101,
                    userId: 7,
                    name: 'Alice Smith',
                    email: 'alice@ems.local',
                    registrationDate: regDate,
                    ticketCode: 'TKT-E10-U7-XYZ',
                    status: 'confirmed'
                }
            ]
        });
    });

    it('TC-ORG-01e: should permit administrator to view participants for any event regardless of owner', async () => {
        jest.spyOn(Event, 'findByPk').mockResolvedValue({
            id: 10,
            title: 'Hackathon 2026',
            capacity: 100,
            organizerId: 99
        });

        jest.spyOn(Registration, 'findAll').mockResolvedValue([]);

        const req = { params: { eventId: '10' }, user: { id: 1, role: 'administrator' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await getEventParticipants(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            eventId: 10,
            totalParticipants: 0,
            participants: []
        }));
    });
});
