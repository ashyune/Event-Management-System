jest.mock("../models/Event", () => ({
  create: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn()
}));

jest.mock("../models/AuditLog", () => ({
  create: jest.fn()
}));

jest.mock("../models/Registration", () => ({
  count: jest.fn()
}));

const Event = require("../models/Event");
const AuditLog = require("../models/AuditLog");

const {
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent
} = require("../controllers/eventController");

describe("US-26: Event Audit Logging", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: { eventId: "1" },
      user: { id: 10, role: "organizer" }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    AuditLog.create.mockResolvedValue({});
  });

  describe("Event Creation", () => {
    test("should create an audit record when an event is created", async () => {
      const event = {
        id: 1,
        title: "Technology Summit",
        status: "draft",
        organizerId: 10
      };

      req.body = {
        title: "Technology Summit",
        description: "Technology event",
        date: "2099-12-01",
        time: "10:30",
        venue: "Bangalore",
        capacity: 100
      };

      Event.create.mockResolvedValue(event);

      await createEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(AuditLog.create).toHaveBeenCalledWith({
        userId: 10,
        action: "EVENT_CREATED",
        entityId: 1,
        entityType: "event",
        metadata: {
          title: "Technology Summit",
          status: "draft"
        }
      });
    });

    test("should not create an audit record when event creation fails validation", async () => {
      req.body = {
        title: "",
        date: "",
        time: "",
        venue: "",
        capacity: 0
      };

      await createEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(AuditLog.create).not.toHaveBeenCalled();
      expect(Event.create).not.toHaveBeenCalled();
    });
  });

  describe("Event Update", () => {
    test("should create an audit record when an event is updated", async () => {
      const event = {
        id: 1,
        organizerId: 10,
        update: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk.mockResolvedValue(event);

      req.body = {
        title: "Updated Technology Summit",
        venue: "PES University"
      };

      await updateEvent(req, res, next);

      expect(event.update).toHaveBeenCalledWith({
        title: "Updated Technology Summit",
        venue: "PES University"
      });

      expect(AuditLog.create).toHaveBeenCalledWith({
        userId: 10,
        action: "EVENT_UPDATED",
        entityId: 1,
        entityType: "event",
        metadata: {
          changedFields: ["title", "venue"]
        }
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should not create an audit record for an unauthorized update", async () => {
      Event.findByPk.mockResolvedValue({
        id: 1,
        organizerId: 20
      });

      req.body = { title: "Unauthorized Update" };

      await updateEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(AuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("Event Publishing", () => {
    test("should create an audit record when an event is published", async () => {
      const event = {
        id: 1,
        organizerId: 10,
        status: "draft",
        save: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk.mockResolvedValue(event);

      await publishEvent(req, res, next);

      expect(event.status).toBe("published");
      expect(AuditLog.create).toHaveBeenCalledWith({
        userId: 10,
        action: "EVENT_PUBLISHED",
        entityId: 1,
        entityType: "event",
        metadata: {
          status: "published"
        }
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should not create an audit record when publishing is rejected", async () => {
      Event.findByPk.mockResolvedValue({
        id: 1,
        organizerId: 10,
        status: "published",
        save: jest.fn()
      });

      await publishEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(AuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("Event Cancellation", () => {
    test("should create an audit record when an event is cancelled", async () => {
      const event = {
        id: 1,
        organizerId: 10,
        status: "published",
        save: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk.mockResolvedValue(event);

      await cancelEvent(req, res, next);

      expect(event.status).toBe("cancelled");
      expect(AuditLog.create).toHaveBeenCalledWith({
        userId: 10,
        action: "EVENT_CANCELLED",
        entityId: 1,
        entityType: "event",
        metadata: {
          status: "cancelled"
        }
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("should not create an audit record when cancellation is rejected", async () => {
      Event.findByPk.mockResolvedValue({
        id: 1,
        organizerId: 20,
        status: "published"
      });

      await cancelEvent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(AuditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("Audit Failure Handling", () => {
    test("should pass audit logging errors to error middleware", async () => {
      const event = {
        id: 1,
        organizerId: 10,
        status: "draft",
        save: jest.fn().mockResolvedValue(true)
      };

      Event.findByPk.mockResolvedValue(event);

      const auditError = new Error("Audit database unavailable");
      AuditLog.create.mockRejectedValue(auditError);

      await publishEvent(req, res, next);

      expect(next).toHaveBeenCalledWith(auditError);
    });
  });
});
