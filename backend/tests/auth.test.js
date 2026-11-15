require("dotenv").config();

const bcrypt = require("bcryptjs");

jest.mock("../models/User", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const User = require("../models/User");
const { register, login } = require("../controllers/authController");

describe("Authentication and Password Hashing", () => {
  const plainPassword = "SecurePass123";

  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("Registration", () => {
    test("should hash the password before storing the user", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: plainPassword,
      };

      User.findOne.mockResolvedValue(null);

      User.create.mockImplementation(async (data) => ({
        id: 1,
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash: data.passwordHash,
      }));

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(User.create).toHaveBeenCalledTimes(1);

      const storedUser = User.create.mock.calls[0][0];

      expect(storedUser.passwordHash).not.toBe(plainPassword);
      expect(storedUser.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(
        await bcrypt.compare(plainPassword, storedUser.passwordHash)
      ).toBe(true);

      expect(res.json.mock.calls[0][0].user).not.toHaveProperty("password");
      expect(res.json.mock.calls[0][0].user).not.toHaveProperty("passwordHash");
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Login", () => {
    test("should authenticate using the correct password", async () => {
      const passwordHash = await bcrypt.hash(plainPassword, 12);

      req.body = {
        email: "test@example.com",
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

      expect(res.status).toHaveBeenCalledWith(200);

      const response = res.json.mock.calls[0][0];

      expect(response.message).toBe("Login successful");
      expect(response.token).toBeDefined();
      expect(response.user).not.toHaveProperty("password");
      expect(response.user).not.toHaveProperty("passwordHash");
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject an incorrect password", async () => {
      const passwordHash = await bcrypt.hash(plainPassword, 12);

      req.body = {
        email: "test@example.com",
        password: "WrongPassword123",
      };

      User.findOne.mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "participant",
        passwordHash,
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Invalid email or password"
      );
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject an unknown email", async () => {
      req.body = {
        email: "unknown@example.com",
        password: plainPassword,
      };

      User.findOne.mockResolvedValue(null);

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json.mock.calls[0][0].message).toBe(
        "Invalid email or password"
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
});