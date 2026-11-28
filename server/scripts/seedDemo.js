// Seed clearly-labeled sample data for local development and demos.
// Usage: MONGO_URI=... [DB_NAME=...] node scripts/seedDemo.js
// Safe to re-run: it skips seeding when sample quizzes already exist.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const Instructor = require("../src/models/Instructor");
const Quiz = require("../src/models/Quiz");

const SAMPLE_QUIZZES = [
  {
    title: "Sample Quiz: JavaScript Basics",
    description: "Sample quiz with demo content. Created to showcase ClassFlow.",
    published: true,
    questions: [
      { text: "Which keyword declares a block-scoped variable?", options: ["var", "let", "function", "global"], correctIndex: 1 },
      { text: "What does JSON.parse do?", options: ["Converts a JSON string to a value", "Converts a value to a JSON string", "Validates JSON schemas", "Fetches JSON over HTTP"], correctIndex: 0 },
      { text: "Which array method returns a new array with each item transformed?", options: ["forEach", "map", "find", "reduce"], correctIndex: 1 },
    ],
  },
  {
    title: "Sample Quiz: HTML and CSS Basics",
    description: "Sample quiz with demo content. Created to showcase ClassFlow.",
    published: true,
    questions: [
      { text: "Which tag creates a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], correctIndex: 1 },
      { text: "Which CSS property changes text color?", options: ["font-style", "text-color", "color", "background"], correctIndex: 2 },
      { text: "Which layout system uses rows and columns with gap?", options: ["float", "position", "grid", "table"], correctIndex: 2 },
    ],
  },
];

async function main() {
  await connectDB();

  const existing = await Quiz.findOne({ title: /^Sample Quiz:/ });
  if (existing) {
    console.log("Sample quizzes already present; nothing to do.");
    return;
  }

  const password = process.env.DEMO_INSTRUCTOR_PASSWORD;
  if (!password) {
    throw new Error("Set DEMO_INSTRUCTOR_PASSWORD for the sample instructor account");
  }

  let user = await User.findOne({ email: "demo.instructor@example.com" });
  if (!user) {
    user = await User.create({
      name: "Demo Instructor (sample)",
      email: "demo.instructor@example.com",
      password,
      role: "instructor",
    });
  }

  let profile = await Instructor.findOne({ user: user._id });
  if (!profile) {
    profile = await Instructor.create({ user: user._id, headline: "Sample instructor profile for demos" });
  }

  for (const data of SAMPLE_QUIZZES) {
    await Quiz.create({ ...data, instructor: profile._id });
    console.log(`Seeded: ${data.title}`);
  }
}

main()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
