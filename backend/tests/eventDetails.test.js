
const { getEventById } = require('../controllers/eventController');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

describe('Event Details and Availability API', () => {
    let req;
    let res;

    beforeEach(() => {
        jest.restoreAllMocks();

        req = {
            params: {
                id: '2'
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return published event details with available seats', async () => {
        const mockEvent = {
            id: 2,
            title: 'Event Listing Test',
            capacity: 100,
            status: 'published',
            toJSON: () => ({
                id: 2,
                title: 'Event Listing Test',
                capacity: 100,
                status: 'published'
            })
        };

        jest.spyOn(Event, 'findByPk').mockResolvedValue(mockEvent);
        jest.spyOn(Registration, 'count').mockResolvedValue(20);

        await getEventById(req, res);

        expect(Event.findByPk).toHaveBeenCalledWith(2);
        expect(Registration.count).toHaveBeenCalledWith({
            where: {
                eventId: 2,
                status: 'confirmed'
            }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            event: expect.objectContaining({
                confirmedRegistrations: 20,
                seatsAvailable: 80
            })
        });
    });

    it('should return zero available seats when event is full', async () => {
        const mockEvent = {
            id: 2,
            capacity: 100,
            status: 'published',
            toJSON: () => ({
                id: 2,
                capacity: 100,
                status: 'published'
            })
        };

        jest.spyOn(Event, 'findByPk').mockResolvedValue(mockEvent);
        jest.spyOn(Registration, 'count').mockResolvedValue(100);

        await getEventById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            event: expect.objectContaining({
                confirmedRegistrations: 100,
                seatsAvailable: 0
            })
        });
    });

    it('should return 404 when event does not exist', async () => {
        jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

        await getEventById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Published event not found'
        });
    });

    it('should return 404 when event is not published', async () => {
        jest.spyOn(Event, 'findByPk').mockResolvedValue({
            id: 2,
            status: 'draft'
        });

        const countSpy = jest.spyOn(Registration, 'count');

        await getEventById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(countSpy).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid event ID', async () => {
        req.params.id = 'abc';

        const findByPkSpy = jest.spyOn(Event, 'findByPk');
        const countSpy = jest.spyOn(Registration, 'count');

        await getEventById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(findByPkSpy).not.toHaveBeenCalled();
        expect(countSpy).not.toHaveBeenCalled();
    });

    it('should return 500 when a database error occurs', async () => {
        jest.spyOn(Event, 'findByPk').mockRejectedValue(
            new Error('Database error')
        );

        await getEventById(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Unable to retrieve event details'
        });
    });
});
