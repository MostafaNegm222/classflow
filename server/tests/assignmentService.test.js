jest.mock("../src/models/Instructor", () => ({ findOne: jest.fn() }));
jest.mock("../src/models/Submission", () => ({ create: jest.fn(), find: jest.fn(), findOne: jest.fn() }));
jest.mock("../src/models/Assignment", () => {
  function MockAssignment(data) {
    Object.assign(this, data);
  }
  MockAssignment.prototype.save = jest.fn();
  MockAssignment.find = jest.fn();
  MockAssignment.findOne = jest.fn();
  MockAssignment.findById = jest.fn();
  return MockAssignment;
});

const Instructor = require("../src/models/Instructor");
const Assignment = require("../src/models/Assignment");
const Submission = require("../src/models/Submission");
const assignmentService = require("../src/services/assignmentService");

// A chainable stand-in for a Mongoose query.
function fakeQuery(result) {
  const q = {
    populate() { return q; },
    find() { return q; },
    sort() { return q; },
    select() { return q; },
    skip() { return q; },
    limit() { return q; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return q;
}

const sampleAssignment = {
  _id: "assignment-1",
  title: "Build a REST API",
  brief: "CRUD endpoints for a resource of your choice",
  published: true,
  instructor: "instructor-1",
};

afterEach(() => jest.clearAllMocks());

describe("listAssignments", () => {
  test("only queries published assignments", async () => {
    Assignment.find.mockReturnValue(fakeQuery([sampleAssignment]));

    const result = await assignmentService.listAssignments({});

    expect(Assignment.find).toHaveBeenCalledWith({ published: true });
    expect(result.count).toBe(1);
    expect(result.assignments[0].title).toBe("Build a REST API");
  });
});

describe("getAssignmentBySlug", () => {
  test("returns a published assignment", async () => {
    Assignment.findOne.mockReturnValue(fakeQuery(sampleAssignment));

    const result = await assignmentService.getAssignmentBySlug("build-a-rest-api-abc123");

    expect(Assignment.findOne).toHaveBeenCalledWith({
      slug: "build-a-rest-api-abc123",
      published: true,
    });
    expect(result.title).toBe("Build a REST API");
  });

  test("throws a 404 when the slug is missing or unpublished", async () => {
    Assignment.findOne.mockReturnValue(fakeQuery(null));

    await expect(assignmentService.getAssignmentBySlug("nope")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("createAssignment", () => {
  test("rejects users without an instructor profile", async () => {
    Instructor.findOne.mockResolvedValue(null);

    await expect(assignmentService.createAssignment("user-1", { title: "X" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test("links the new assignment to the instructor profile", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Assignment.prototype.save.mockResolvedValue(undefined);

    const result = await assignmentService.createAssignment("user-1", { title: "API task" });

    expect(result.instructor).toBe("instructor-1");
    expect(Assignment.prototype.save).toHaveBeenCalled();
  });
});

describe("updateAssignment", () => {
  test("updates editable fields for the owner", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    const assignment = { instructor: "instructor-1", title: "Old", save: jest.fn() };
    Assignment.findById.mockResolvedValue(assignment);

    const result = await assignmentService.updateAssignment("user-1", "assignment-1", {
      title: "New",
      published: true,
    });

    expect(result.title).toBe("New");
    expect(result.published).toBe(true);
    expect(assignment.save).toHaveBeenCalled();
  });

  test("rejects non-owners with 403", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Assignment.findById.mockResolvedValue({ instructor: "someone-else", save: jest.fn() });

    await expect(
      assignmentService.updateAssignment("user-1", "assignment-1", { title: "Hijack" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("deleteAssignment", () => {
  test("deletes an owned assignment", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    const assignment = { instructor: "instructor-1", deleteOne: jest.fn() };
    Assignment.findById.mockResolvedValue(assignment);

    const result = await assignmentService.deleteAssignment("user-1", "assignment-1");

    expect(assignment.deleteOne).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});

describe("submitAssignment", () => {
  test("rejects submissions to unpublished or missing assignments", async () => {
    Assignment.findById.mockResolvedValue({ _id: "assignment-1", published: false });

    await expect(
      assignmentService.submitAssignment("user-1", "assignment-1", { text: "work" })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("rejects empty submissions with 400", async () => {
    Assignment.findById.mockResolvedValue(sampleAssignment);

    await expect(
      assignmentService.submitAssignment("user-1", "assignment-1", {})
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("creates a first submission", async () => {
    Assignment.findById.mockResolvedValue(sampleAssignment);
    Submission.findOne.mockResolvedValue(null);
    Submission.create.mockResolvedValue({ _id: "submission-1" });

    const result = await assignmentService.submitAssignment("user-1", "assignment-1", {
      text: "here is my work",
    });

    expect(Submission.create).toHaveBeenCalledWith({
      assignment: "assignment-1",
      user: "user-1",
      text: "here is my work",
      link: "",
    });
    expect(result).toEqual({ submissionId: "submission-1", resubmitted: false });
  });

  test("updates the existing submission on resubmit", async () => {
    Assignment.findById.mockResolvedValue(sampleAssignment);
    const existing = { _id: "submission-1", text: "old", link: "", save: jest.fn() };
    Submission.findOne.mockResolvedValue(existing);

    const result = await assignmentService.submitAssignment("user-1", "assignment-1", {
      text: "revised",
      link: "https://example.com/repo",
    });

    expect(existing.text).toBe("revised");
    expect(existing.link).toBe("https://example.com/repo");
    expect(existing.save).toHaveBeenCalled();
    expect(Submission.create).not.toHaveBeenCalled();
    expect(result).toEqual({ submissionId: "submission-1", resubmitted: true });
  });
});

describe("listMySubmissions", () => {
  test("queries submissions for the logged-in user", async () => {
    Submission.find.mockReturnValue(fakeQuery([{ _id: "submission-1" }]));

    const result = await assignmentService.listMySubmissions("user-1", {});

    expect(Submission.find).toHaveBeenCalledWith({ user: "user-1" });
    expect(result.count).toBe(1);
  });
});

describe("listAssignmentSubmissionsForOwner", () => {
  test("rejects non-owners with 403", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Assignment.findById.mockResolvedValue({ instructor: "someone-else" });

    await expect(
      assignmentService.listAssignmentSubmissionsForOwner("user-1", "assignment-1")
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("lists submissions for the owner", async () => {
    Instructor.findOne.mockResolvedValue({ _id: "instructor-1" });
    Assignment.findById.mockResolvedValue({ _id: "assignment-1", instructor: "instructor-1" });
    Submission.find.mockReturnValue(fakeQuery([{ _id: "submission-1" }, { _id: "submission-2" }]));

    const result = await assignmentService.listAssignmentSubmissionsForOwner("user-1", "assignment-1");

    expect(Submission.find).toHaveBeenCalledWith({ assignment: "assignment-1" });
    expect(result.count).toBe(2);
  });
});
