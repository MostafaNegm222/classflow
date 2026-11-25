const mongoose = require("mongoose");

// One user's graded submission for one quiz, kept for progress tracking.
const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: { type: [Number], default: [] },
    correct: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    scorePercent: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
