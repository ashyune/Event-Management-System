const express = require("express");
const cors = require("cors");
require("dotenv").config();

const sequelize = require("./config/database");
require("./models/User");
require("./models/Event");

const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");
const authenticate = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/roleMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Event Management System API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

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

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  sequelize.authenticate()
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
