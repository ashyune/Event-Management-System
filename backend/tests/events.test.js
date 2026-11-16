
const {
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getPublishedEvents
} = require("../controllers/eventController");

const Event = require("../models/Event");

jest.mock("../models/AuditLog", () => ({
  create: jest.fn().mockResolvedValue({})
}));

describe("Event Module Test Cases", () => {
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  describe("TC-EVT-01: Event Creation", () => {
    test("should successfully create an event", async () => {
      const mockEvent = {
        id: 1,
        title: "Technology Summit",
        description: "A technology event",
        date: "2099-12-25",
        time: "10:00",
        venue: "Bangalore",
        capacity: 100,
        status: "draft",
        organizerId: 1
      };

      Event.create = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        body: {
          title: "Technology Summit",
          description: "A technology event",
          date: "2099-12-25",
          time: "10:00",
          venue: "Bangalore",
          capacity: 100
        },
        user: { id: 1 }
      };

      await createEvent(req, res, jest.fn());

      expect(Event.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    test("should reject event creation with missing required fields", async () => {
      const req = {
        body: {
          title: "",
          date: "2099-12-25",
          time: "10:00",
          venue: "Bangalore",
          capacity: 100
        },
        user: { id: 1 }
      };

      await createEvent(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Event.create).not.toHaveBeenCalled();
    });

    test("should reject an event with a past date", async () => {
      const req = {
        body: {
          title: "Past Event",
          description: "An event in the past",
          date: "2000-01-01",
          time: "10:00",
          venue: "Bangalore",
          capacity: 100
        },
        user: { id: 1 }
      };

      await createEvent(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Event.create).not.toHaveBeenCalled();
    });
  });

  describe("TC-EVT-02: Event Update", () => {
    test("should successfully update an event owned by the organizer", async () => {
      const mockEvent = {
        id: 1,
        organizerId: 1,
        title: "Old Title",
        update: jest.fn().mockImplementation(async (updates) => {
          Object.assign(mockEvent, updates);
          return mockEvent;
        })
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        params: { eventId: 1 },
        body: { title: "Updated Title" },
        user: { id: 1, role: "organizer" }
      };

      await updateEvent(req, res, jest.fn());

      expect(Event.findByPk).toHaveBeenCalledWith(1);
      expect(mockEvent.update).toHaveBeenCalledWith({
        title: "Updated Title"
      });
      expect(mockEvent.title).toBe("Updated Title");
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("should reject an update by an unauthorized organizer", async () => {
      const mockEvent = {
        id: 1,
        organizerId: 2,
        save: jest.fn()
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        params: { id: 1 },
        body: { title: "Updated Title" },
        user: { id: 1 }
      };

      await updateEvent(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockEvent.save).not.toHaveBeenCalled();
    });

    test("should return 404 when updating a nonexistent event", async () => {
      Event.findByPk = jest.fn().mockResolvedValue(null);

      const req = {
        params: { id: 999 },
        body: { title: "Updated Title" },
        user: { id: 1 }
      };

      await updateEvent(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("should reject an update with no editable fields", async () => {
      const mockEvent = {
        id: 1,
        organizerId: 1,
        save: jest.fn()
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        params: { id: 1 },
        body: {},
        user: { id: 1 }
      };

      await updateEvent(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockEvent.save).not.toHaveBeenCalled();
    });
  });

  describe("TC-EVT-03: Event Status Management", () => {
    test("should successfully publish a draft event", async () => {
      const mockEvent = {
        id: 1,
        organizerId: 1,
        status: "draft",
        save: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        params: { id: 1 },
        user: { id: 1 }
      };

      await publishEvent(req, res, jest.fn());

      expect(mockEvent.status).toBe("published");
      expect(mockEvent.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should successfully cancel an event", async () => {
      const mockEvent = {
        id: 1,
        organizerId: 1,
        status: "published",
        save: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        params: { id: 1 },
        user: { id: 1 }
      };

      await cancelEvent(req, res, jest.fn());

      expect(mockEvent.status).toBe("cancelled");
      expect(mockEvent.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should prevent publishing an already published event", async () => {
      const mockEvent = {
        id: 1,
        organizerId: 1,
        status: "published",
        save: jest.fn()
      };

      Event.findByPk = jest.fn().mockResolvedValue(mockEvent);

      const req = {
        params: { id: 1 },
        user: { id: 1 }
      };

      await publishEvent(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockEvent.save).not.toHaveBeenCalled();
    });
  });

  describe("TC-VIEW-01 and TC-VIEW-02: Event Listing", () => {
    test("should retrieve published events successfully", async () => {
      const mockEvents = [
        {
          id: 1,
          title: "Technology Summit",
          status: "published"
        },
        {
          id: 2,
          title: "Developer Conference",
          status: "published"
        }
      ];

      jest.spyOn(Event, "findAll").mockResolvedValue(mockEvents);

      const req = {
        query: {}
      };

      await getPublishedEvents(req, res, jest.fn());

      expect(Event.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "published" }
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        count: 2,
        events: mockEvents
      });
    });

    test("should return an empty list when no published events exist", async () => {
      jest.spyOn(Event, "findAll").mockResolvedValue([]);

      const req = {
        query: {}
      };

      await getPublishedEvents(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        count: 0,
        events: []
      });
    });
  });
});
