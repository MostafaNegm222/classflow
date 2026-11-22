require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`ClassFlow API on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
