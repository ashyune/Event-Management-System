const { rateLimit } = require("express-rate-limit");

const createLoginRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      message: "Too many login attempts. Please try again later.",
    },
    ...options,
  });
};

module.exports = createLoginRateLimiter;