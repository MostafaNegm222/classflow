// Vercel serverless entry for the whole ClassFlow API.
//
// vercel.json rewrites every request to this function, and the
// Express app in src/app.js keeps its normal routes, so the same
// code runs locally, in Docker, and here.
//
// MongoDB is connected once per warm instance and the in-flight promise
// is reused, so concurrent cold requests share a single connection
// instead of opening one each.
const app = require("../src/app");
const connectDB = require("../src/config/db");

let connecting = null;

module.exports = async (req, res) => {
  if (!connecting) {
    connecting = connectDB().catch((err) => {
      // Allow the next request to retry after a failed attempt.
      connecting = null;
      throw err;
    });
  }
  try {
    await connecting;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return res.status(500).json({ error: "Database unavailable" });
  }
  return app(req, res);
};
