const mongoose = require("mongoose");

// Connect to MongoDB once at startup; fail fast if it does not work.
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = connectDB;
