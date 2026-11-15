
const {
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  getPublishedEvents
} = require("../controllers/eventController");

const Event = require("../models/Event");

describe("Event Module Test Cases", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("TC-EVT-01: Event Creation", () => {
    test("should successfully create an event", async () => {
      const mockEvent = {
        id: 1,
        title: "Technology Summit",
        date: "2099-12-01",
        time: "10:30",
        venue: "Bangalore",
        capacity: 100,
        status: "draft",
        organizerId: 1
      };

      jest.spyOn(Event, "create").mockResolvedValue(mockEvent);

      const req = {
        body: {
          title: " Technology Summit ",
          description: "Annual technology event",
          date: "2099-12-01",
          time: "10:30",
          venue: " Bangalore ",
          capacity: 100
        },
        user: { id: 1 }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createEvent(req, res);

      expect(Event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Technology Summit",
          venue: "Bangalore",
          capacity: 100,
          status: "draft",
          organizerId: 1
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Event created successfully",
          event: mockEvent
        })
      );
    });

    test("should reject event creation with missing required fields", async () => {
      jest.spyOn(Event, "create");

      const req = {
        body: {
          title: "",
          date: "",
          time: "",
          venue: "",
          capacity: null
        },
        user: { id: 1 }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(Event.create).not.toHaveBeenCalled();
    });

    test("should reject an event with a past date", async () => {
      const req = {
        body: {
          title: "Past Event",
          date: "2020-01-01",
          time: "10:30",
          venue: "Bangalore",
          capacity: 50
        },
        user: { id: 1 }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await createEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Event date must be a valid date that is not in the past"
        })
      );
    });
  });

  describe("TC-EVT-02: Event Update", () => {
    test("should successfully update an event owned by the organizer", async () => {
      const mockUpdate = jest.fn().mockResolvedValue(true);

      const mockEvent = {
        id: 1,
        organizerId: 1,
        update: mockUpdate
      };

      jest.spyOn(Event, "findByPk").mockResolvedValue(mockEvent);

      const req = {
        params: { eventId: "1" },
        body: { title: "Updated Summit" },
        user: { id: 1, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateEvent(req, res);

      expect(mockUpdate).toHaveBeenCalledWith({
        title: "Updated Summit"
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Event updated successfully"
        })
      );
    });

    test("should reject an update by an unauthorized organizer", async () => {
      jest.spyOn(Event, "findByPk").mockResolvedValue({
        id: 1,
        organizerId: 2
      });

      const req = {
        params: { eventId: "1" },
        body: { title: "Unauthorized Update" },
        user: { id: 5, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "You are not authorized to edit this event"
        })
      );
    });

    test("should return 404 when updating a nonexistent event", async () => {
      jest.spyOn(Event, "findByPk").mockResolvedValue(null);

      const req = {
        params: { eventId: "999" },
        body: { title: "Updated Event" },
        user: { id: 1, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Event not found"
        })
      );
    });

    test("should reject an update with no editable fields", async () => {
      jest.spyOn(Event, "findByPk").mockResolvedValue({
        id: 1,
        organizerId: 1
      });

      const req = {
        params: { eventId: "1" },
        body: {},
        user: { id: 1, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "At least one editable field is required"
        })
      );
    });
  });

  describe("TC-EVT-03: Event Status Management", () => {
    test("should successfully publish a draft event", async () => {
      const mockSave = jest.fn().mockResolvedValue(true);

      const mockEvent = {
        id: 1,
        organizerId: 1,
        status: "draft",
        save: mockSave
      };

      jest.spyOn(Event, "findByPk").mockResolvedValue(mockEvent);

      const req = {
        params: { eventId: "1" },
        user: { id: 1, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await publishEvent(req, res);

      expect(mockEvent.status).toBe("published");
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should successfully cancel an event", async () => {
      const mockSave = jest.fn().mockResolvedValue(true);

      const mockEvent = {
        id: 2,
        organizerId: 1,
        status: "published",
        save: mockSave
      };

      jest.spyOn(Event, "findByPk").mockResolvedValue(mockEvent);

      const req = {
        params: { eventId: "2" },
        user: { id: 1, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await cancelEvent(req, res);

      expect(mockEvent.status).toBe("cancelled");
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should prevent publishing an already published event", async () => {
      const mockSave = jest.fn();

      jest.spyOn(Event, "findByPk").mockResolvedValue({
        id: 3,
        organizerId: 1,
        status: "published",
        save: mockSave
      });

      const req = {
        params: { eventId: "3" },
        user: { id: 1, role: "organizer" }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await publishEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockSave).not.toHaveBeenCalled();
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

      const req = {};

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getPublishedEvents(req, res);

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

      const req = {};

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getPublishedEvents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        count: 0,
        events: []
      });
    });
  });
});
