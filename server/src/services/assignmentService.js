const Instructor = require("../models/Instructor");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const ApiFeatures = require("../utils/apiFeatures");

const INSTRUCTOR_PUBLIC_FIELDS = "headline slug";

function fail(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// The instructor profile that belongs to this account, or a clear error.
async function ownInstructorProfile(userId) {
  const profile = await Instructor.findOne({ user: userId });
  if (!profile) throw fail(403, "Create your instructor profile before managing assignments");
  return profile;
}

// Public catalog: only published assignments.
async function listAssignments(queryString) {
  const baseQuery = Assignment.find({ published: true }).populate(
    "instructor",
    INSTRUCTOR_PUBLIC_FIELDS
  );
  const features = new ApiFeatures(baseQuery, queryString)
    .filter()
    .search(["title", "brief"])
    .sort()
    .limitFields()
    .paginate();
  const assignments = await features.mongooseQuery;
  return { count: assignments.length, assignments };
}

// One published assignment by slug.
async function getAssignmentBySlug(slug) {
  const assignment = await Assignment.findOne({ slug, published: true }).populate(
    "instructor",
    INSTRUCTOR_PUBLIC_FIELDS
  );
  if (!assignment) throw fail(404, "Assignment not found");
  return assignment;
}

// Create an assignment owned by the logged-in instructor.
async function createAssignment(userId, data = {}) {
  const profile = await ownInstructorProfile(userId);
  const { title, brief, dueDate, published } = data;
  const assignment = new Assignment({ title, brief, dueDate, published, instructor: profile._id });
  await assignment.save();
  return assignment;
}

// Load an assignment and make sure this account owns it.
async function ownAssignment(userId, assignmentId) {
  const profile = await ownInstructorProfile(userId);
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw fail(404, "Assignment not found");
  if (assignment.instructor.toString() !== profile._id.toString()) {
    throw fail(403, "You can only manage your own assignments");
  }
  return assignment;
}

// Update only the editable fields of an owned assignment.
async function updateAssignment(userId, assignmentId, data = {}) {
  const assignment = await ownAssignment(userId, assignmentId);
  const { title, brief, dueDate, published } = data;
  if (title !== undefined) assignment.title = title;
  if (brief !== undefined) assignment.brief = brief;
  if (dueDate !== undefined) assignment.dueDate = dueDate;
  if (published !== undefined) assignment.published = published;
  await assignment.save();
  return assignment;
}

async function deleteAssignment(userId, assignmentId) {
  const assignment = await ownAssignment(userId, assignmentId);
  await assignment.deleteOne();
  return { deleted: true };
}

// Submit work for a published assignment. One submission per trainee per
// assignment: submitting again updates the existing submission.
async function submitAssignment(userId, assignmentId, data = {}) {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment || !assignment.published) throw fail(404, "Assignment not found");
  const { text = "", link = "" } = data;
  if (!text && !link) throw fail(400, "A submission needs text or a link");
  const existing = await Submission.findOne({ assignment: assignment._id, user: userId });
  if (existing) {
    existing.text = text;
    existing.link = link;
    await existing.save();
    return { submissionId: existing._id, resubmitted: true };
  }
  const submission = await Submission.create({ assignment: assignment._id, user: userId, text, link });
  return { submissionId: submission._id, resubmitted: false };
}

// Every submission the logged-in user has made, newest first.
async function listMySubmissions(userId, queryString = {}) {
  const baseQuery = Submission.find({ user: userId }).populate("assignment", "title slug dueDate");
  const features = new ApiFeatures(baseQuery, queryString).sort().paginate();
  const submissions = await features.mongooseQuery;
  return { count: submissions.length, submissions };
}

// Every submission on one assignment, visible only to the instructor who owns it.
async function listAssignmentSubmissionsForOwner(userId, assignmentId) {
  const profile = await ownInstructorProfile(userId);
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw fail(404, "Assignment not found");
  if (assignment.instructor.toString() !== profile._id.toString()) {
    throw fail(403, "You can only see submissions on your own assignments");
  }
  const submissions = await Submission.find({ assignment: assignment._id })
    .populate("user", "name slug")
    .sort("-createdAt");
  return { count: submissions.length, submissions };
}

module.exports = {
  listAssignments,
  getAssignmentBySlug,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  listMySubmissions,
  listAssignmentSubmissionsForOwner,
};
