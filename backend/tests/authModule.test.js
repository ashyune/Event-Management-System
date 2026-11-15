require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const User = require("../models/User");
const { register, login } = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");

describe("Authentication Module Tests (US-20)", () => {
  const plainPassword = "SecurePass123";

  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("Registration", () => {
    test("should reject registration when required fields are missing", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
      };

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toBe(
        "All fields are required"
      );
      expect(User.findOne).not.toHaveBeenCalled();
      expect(User.create).not.toHaveBeenCalled();
    });

    test("should reject passwords shorter than 8 characters", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "short",
      };

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Password must be at least 8 characters"
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should reject registration with an already registered email", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: plainPassword,
      };

      User.findOne.mockResolvedValue({
        id: 1,
        email: "test@example.com",
      });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Email is already registered"
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    test("should normalize the name and email during registration", async () => {
      req.body = {
        name: "  Test User  ",
        email: "  TEST@EXAMPLE.COM  ",
        password: plainPassword,
      };

      User.findOne.mockResolvedValue(null);

      User.create.mockImplementation(async (data) => ({
        id: 1,
        ...data,
      }));

      await register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          email: "test@example.com",
          role: "participant",
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle Sequelize validation errors", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: plainPassword,
      };

      User.findOne.mockResolvedValue(null);

      User.create.mockRejectedValue({
        name: "SequelizeValidationError",
      });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Invalid email format"
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should forward unexpected registration errors to error middleware", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: plainPassword,
      };

      const error = new Error("Database unavailable");
      User.findOne.mockRejectedValue(error);

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("Login", () => {
    test("should reject login when email or password is missing", async () => {
      req.body = {
        email: "test@example.com",
      };

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Email and password are required"
      );
      expect(User.findOne).not.toHaveBeenCalled();
    });

    test("should normalize email and return a valid JWT on successful login", async () => {
      const passwordHash = await bcrypt.hash(plainPassword, 12);

      req.body = {
        email: "  TEST@EXAMPLE.COM  ",
        password: plainPassword,
      };

      User.findOne.mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "participant",
        passwordHash,
      });

      await login(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });

      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];
      const decoded = jwt.verify(response.token, process.env.JWT_SECRET);

      expect(response.message).toBe("Login successful");
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe("participant");
      expect(next).not.toHaveBeenCalled();
    });

    test("should forward unexpected login errors to error middleware", async () => {
      req.body = {
        email: "test@example.com",
        password: plainPassword,
      };

      const error = new Error("Database unavailable");
      User.findOne.mockRejectedValue(error);

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("Authentication Middleware", () => {
    test("should reject requests without an authorization header", () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Authentication required"
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject malformed authorization headers", () => {
      req.headers.authorization = "Basic invalid-token";

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Authentication required"
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject invalid JWTs", () => {
      req.headers.authorization = "Bearer invalid-token";

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Invalid or expired token"
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject expired JWTs", () => {
      const token = jwt.sign(
        { id: 1, role: "participant" },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
      );

      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Invalid or expired token"
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should authenticate requests with a valid JWT", () => {
      const token = jwt.sign(
        { id: 1, role: "participant" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toEqual({
        id: 1,
        role: "participant",
      });
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});