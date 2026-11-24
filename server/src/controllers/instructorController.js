const instructorService = require("../services/instructorService");

// Controllers only translate HTTP <-> service calls; the logic lives in the service.
async function list(req, res, next) {
  try {
    res.json(await instructorService.listInstructors(req.query));
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    res.json(await instructorService.getInstructorBySlug(req.params.slug));
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    res.json(await instructorService.getMyProfile(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function upsertMe(req, res, next) {
  try {
    res.json(await instructorService.upsertMyProfile(req.user.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug, getMe, upsertMe };
