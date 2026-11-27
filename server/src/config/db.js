const mongoose = require("mongoose");

// Connect to MongoDB once at startup; fail fast if it does not work.
// DB_NAME (optional) pins the database inside the cluster, so one Atlas
// cluster can host several apps without them touching each other's data.
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }
  const options = {};
  if (process.env.DB_NAME) {
    options.dbName = process.env.DB_NAME;
  }
  await mongoose.connect(uri, options);
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}

module.exports = connectDB;
