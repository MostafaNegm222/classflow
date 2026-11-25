const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const quizRoutes = require("./routes/quizRoutes");
const errorHandler = require("./middleware/error");

// The "View" layer of this API: everything HTTP/JSON is assembled here.
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/quizzes", quizRoutes);

app.use(errorHandler);

module.exports = app;
