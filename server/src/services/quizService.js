const Instructor = require("../models/Instructor");
const Quiz = require("../models/Quiz");
const ApiFeatures = require("../utils/apiFeatures");

const INSTRUCTOR_PUBLIC_FIELDS = "headline slug";

function fail(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// The quiz shape takers are allowed to see: no correct answers.
function publicQuiz(quiz) {
  const obj = quiz.toObject ? quiz.toObject() : { ...quiz };
  obj.questions = (obj.questions || []).map(({ text, options }) => ({ text, options }));
  return obj;
}

// The instructor profile that belongs to this account, or a clear error.
async function ownInstructorProfile(userId) {
  const profile = await Instructor.findOne({ user: userId });
  if (!profile) throw fail(403, "Create your instructor profile before managing quizzes");
  return profile;
}

// Public catalog: only published quizzes, without correct answers.
async function listQuizzes(queryString) {
  const baseQuery = Quiz.find({ published: true }).populate("instructor", INSTRUCTOR_PUBLIC_FIELDS);
  const features = new ApiFeatures(baseQuery, queryString)
    .filter()
    .search(["title", "description"])
    .sort()
    .limitFields()
    .paginate();
  const quizzes = await features.mongooseQuery;
  return { count: quizzes.length, quizzes: quizzes.map(publicQuiz) };
}

// One published quiz by slug, without correct answers.
async function getQuizBySlug(slug) {
  const quiz = await Quiz.findOne({ slug, published: true }).populate(
    "instructor",
    INSTRUCTOR_PUBLIC_FIELDS
  );
  if (!quiz) throw fail(404, "Quiz not found");
  return publicQuiz(quiz);
}

// Create a quiz owned by the logged-in instructor.
async function createQuiz(userId, data = {}) {
  const profile = await ownInstructorProfile(userId);
  const { title, description, questions, published } = data;
  const quiz = new Quiz({ title, description, questions, published, instructor: profile._id });
  await quiz.save();
  return quiz;
}

// Load a quiz and make sure this account owns it.
async function ownQuiz(userId, quizId) {
  const profile = await ownInstructorProfile(userId);
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw fail(404, "Quiz not found");
  if (quiz.instructor.toString() !== profile._id.toString()) {
    throw fail(403, "You can only manage your own quizzes");
  }
  return quiz;
}

// Update only the editable fields of an owned quiz.
async function updateQuiz(userId, quizId, data = {}) {
  const quiz = await ownQuiz(userId, quizId);
  const { title, description, questions, published } = data;
  if (title !== undefined) quiz.title = title;
  if (description !== undefined) quiz.description = description;
  if (questions !== undefined) quiz.questions = questions;
  if (published !== undefined) quiz.published = published;
  await quiz.save();
  return quiz;
}

async function deleteQuiz(userId, quizId) {
  const quiz = await ownQuiz(userId, quizId);
  await quiz.deleteOne();
  return { deleted: true };
}

// Grade a submission against a published quiz.
// answers: array of chosen option indexes, aligned with the quiz's questions.
async function gradeQuiz(quizId, answers = []) {
  const quiz = await Quiz.findById(quizId);
  if (!quiz || !quiz.published) throw fail(404, "Quiz not found");
  const perQuestion = quiz.questions.map((question, index) => ({
    question: index,
    correct: answers[index] === question.correctIndex,
  }));
  const correct = perQuestion.filter((q) => q.correct).length;
  const total = quiz.questions.length;
  return {
    total,
    correct,
    scorePercent: total === 0 ? 0 : Math.round((correct / total) * 100),
    perQuestion,
  };
}

module.exports = {
  listQuizzes,
  getQuizBySlug,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  gradeQuiz,
};
