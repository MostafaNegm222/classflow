const assignmentService = require("../services/assignmentService");

// Controllers only translate HTTP <-> service calls; the logic lives in the service.
async function list(req, res, next) {
  try {
    res.json(await assignmentService.listAssignments(req.query));
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    res.json(await assignmentService.getAssignmentBySlug(req.params.slug));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await assignmentService.createAssignment(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await assignmentService.updateAssignment(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    res.json(await assignmentService.deleteAssignment(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    res.status(201).json(await assignmentService.submitAssignment(req.user.id, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function mySubmissions(req, res, next) {
  try {
    res.json(await assignmentService.listMySubmissions(req.user.id, req.query));
  } catch (err) {
    next(err);
  }
}

async function assignmentSubmissions(req, res, next) {
  try {
    res.json(await assignmentService.listAssignmentSubmissionsForOwner(req.user.id, req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug, create, update, remove, submit, mySubmissions, assignmentSubmissions };
