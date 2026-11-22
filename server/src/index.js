require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");

const port = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(port, () => console.log(`ClassFlow API on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
