const express = require("express");
const { register, login } = require("../controllers/authController");
const {
  registerValidation,
  loginValidation,
} = require("../middleware/validationMiddleware");
const createLoginRateLimiter = require("../middleware/loginRateLimitMiddleware");

const router = express.Router();
const loginRateLimiter = createLoginRateLimiter();

router.post("/register", registerValidation, register);
router.post("/login", loginRateLimiter, login);

module.exports = router;