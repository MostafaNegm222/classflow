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
  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    // Server-selection failures hide the per-host causes. Log each host
    // with its own error so Atlas network/user problems are visible
    // without printing the connection string itself.
    const servers = err.reason && err.reason.servers;
    if (servers) {
      for (const server of servers.values()) {
        const detail = server.error ? server.error.message : "unknown error";
        console.error(`MongoDB host ${server.host}:${server.port}: ${detail}`);
      }
    }
    throw err;
  }
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);
}

module.exports = connectDB;
