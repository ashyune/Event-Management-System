const express = require("express");
const request = require("supertest");

const app = require("../server");
const createLoginRateLimiter = require("../middleware/loginRateLimitMiddleware");

describe("Security Middleware", () => {
  describe("Helmet security headers", () => {
    test("should include security headers in responses", async () => {
      const response = await request(app).get("/");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
      expect(response.headers["content-security-policy"]).toBeDefined();
    });
  });

  describe("CORS configuration", () => {
    test("should allow the configured frontend origin", async () => {
      const response = await request(app)
        .get("/")
        .set("Origin", "http://localhost:5173");

      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173"
      );
    });

    test("should not allow an unconfigured origin", async () => {
      const response = await request(app)
        .get("/")
        .set("Origin", "http://malicious.example");

      expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("Login rate limiting", () => {
    let testApp;

    beforeEach(() => {
      testApp = express();

      testApp.post(
        "/login",
        createLoginRateLimiter({
          windowMs: 60 * 1000,
          limit: 2,
          skipSuccessfulRequests: false,
        }),
        (req, res) => {
          res.status(401).json({ message: "Invalid credentials" });
        }
      );
    });

    test("should allow requests within the configured limit", async () => {
      const first = await request(testApp).post("/login");
      const second = await request(testApp).post("/login");

      expect(first.status).toBe(401);
      expect(second.status).toBe(401);
    });

    test("should reject requests after the configured limit", async () => {
      await request(testApp).post("/login");
      await request(testApp).post("/login");

      const third = await request(testApp).post("/login");

      expect(third.status).toBe(429);
      expect(third.body.message).toBe(
        "Too many login attempts. Please try again later."
      );
    });
  });
});