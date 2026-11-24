const Instructor = require("../models/Instructor");
const ApiFeatures = require("../utils/apiFeatures");

const USER_PUBLIC_FIELDS = "name slug";

function fail(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Public catalog of instructor profiles with filter/search/sort/pagination.
async function listInstructors(queryString) {
  const baseQuery = Instructor.find().populate("user", USER_PUBLIC_FIELDS);
  const features = new ApiFeatures(baseQuery, queryString)
    .filter()
    .search(["headline", "bio"])
    .sort()
    .limitFields()
    .paginate();
  const instructors = await features.mongooseQuery;
  return { count: instructors.length, instructors };
}

// One public profile by its slug.
async function getInstructorBySlug(slug) {
  const instructor = await Instructor.findOne({ slug }).populate("user", USER_PUBLIC_FIELDS);
  if (!instructor) throw fail(404, "Instructor not found");
  return instructor;
}

// The logged-in instructor's own profile.
async function getMyProfile(userId) {
  const profile = await Instructor.findOne({ user: userId }).populate("user", USER_PUBLIC_FIELDS);
  if (!profile) throw fail(404, "You have no instructor profile yet");
  return profile;
}

// Create or update the logged-in instructor's own profile.
// Uses save() instead of findOneAndUpdate so the slug pre-save hook always runs.
// Only whitelisted fields are accepted, so clients cannot overwrite user or slug.
async function upsertMyProfile(userId, data = {}) {
  const { headline, bio, expertise } = data;
  let profile = await Instructor.findOne({ user: userId });
  if (profile) {
    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (expertise !== undefined) profile.expertise = expertise;
  } else {
    profile = new Instructor({ user: userId, headline, bio, expertise });
  }
  await profile.save();
  return profile;
}

module.exports = { listInstructors, getInstructorBySlug, getMyProfile, upsertMyProfile };
