const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const sequelize = require("./config/database");
require("./models/User");
require("./models/Event");
require("./models/Registration");
require("./models/AuditLog");

const eventRoutes = require("./routes/eventRoutes");
const organizerRoutes = require("./routes/organizerRoutes");
const authRoutes = require("./routes/authRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const authenticate = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Configure allowed frontend origins.
// CLIENT_URL can contain multiple comma-separated origins.
const allowedOrigins = (
  process.env.CLIENT_URL ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "http://localhost:5173")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Security headers.
// HTTPS-upgrade behavior is enabled only in production.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  })
);

// Restrict browser access to configured frontend origins.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Event Management System API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", organizerRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/auth/me", authenticate, (req, res) => {
  res.json({
    message: "Authenticated successfully",
    user: req.user,
  });
});

app.get(
  "/api/admin/test",
  authenticate,
  authorizeRoles("administrator"),
  (req, res) => {
    res.json({
      message: "Administrator access granted",
      user: req.user,
    });
  }
);

// Global 404 and error handling middleware.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => sequelize.sync())
    .then(() => {
      console.log("Database connected successfully");

      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Unable to start server:", error);
      process.exit(1);
    });
}

module.exports = app;