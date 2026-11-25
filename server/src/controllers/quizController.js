const quizService = require("../services/quizService");

// Controllers only translate HTTP <-> service calls; the logic lives in the service.
async function list(req, res, next) {
  try {
    res.json(await quizService.listQuizzes(req.query));
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    res.json(await quizService.getQuizBySlug(req.params.slug));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await quizService.createQuiz(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await quizService.updateQuiz(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    res.json(await quizService.deleteQuiz(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function grade(req, res, next) {
  try {
    res.status(201).json(await quizService.gradeQuiz(req.user.id, req.params.id, req.body.answers));
  } catch (err) {
    next(err);
  }
}

async function myAttempts(req, res, next) {
  try {
    res.json(await quizService.listMyAttempts(req.user.id, req.query));
  } catch (err) {
    next(err);
  }
}

async function quizAttempts(req, res, next) {
  try {
    res.json(await quizService.listQuizAttemptsForOwner(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug, create, update, remove, grade, myAttempts, quizAttempts };
