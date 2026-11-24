jest.mock("../src/models/Instructor", () => {
  function MockInstructor(data) {
    Object.assign(this, data);
  }
  MockInstructor.prototype.save = jest.fn();
  MockInstructor.find = jest.fn();
  MockInstructor.findOne = jest.fn();
  return MockInstructor;
});

const Instructor = require("../src/models/Instructor");
const instructorService = require("../src/services/instructorService");

// A chainable stand-in for a Mongoose query that records every call.
function fakeQuery(result) {
  const q = {
    calls: { find: [], sort: [], select: [], skip: [], limit: [], populate: [] },
    find(arg) { q.calls.find.push(arg); return q; },
    sort(arg) { q.calls.sort.push(arg); return q; },
    select(arg) { q.calls.select.push(arg); return q; },
    skip(n) { q.calls.skip.push(n); return q; },
    limit(n) { q.calls.limit.push(n); return q; },
    populate(...args) { q.calls.populate.push(args); return q; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return q;
}

afterEach(() => jest.clearAllMocks());

describe("listInstructors", () => {
  test("returns instructors with a count and populates the user's public fields", async () => {
    const rows = [{ headline: "Math teacher" }, { headline: "Physics teacher" }];
    const q = fakeQuery(rows);
    Instructor.find.mockReturnValue(q);

    const result = await instructorService.listInstructors({});

    expect(result).toEqual({ count: 2, instructors: rows });
    expect(q.calls.populate[0]).toEqual(["user", "name slug"]);
  });

  test("applies search to headline, bio and slug as a case-insensitive $or", async () => {
    const q = fakeQuery([]);
    Instructor.find.mockReturnValue(q);

    await instructorService.listInstructors({ search: "mona" });

    const searchCall = q.calls.find[q.calls.find.length - 1];
    expect(searchCall.$or).toHaveLength(3);
    expect(searchCall.$or[0].headline).toBeInstanceOf(RegExp);
    expect(searchCall.$or[1].bio).toBeInstanceOf(RegExp);
    expect(searchCall.$or[2].slug).toBeInstanceOf(RegExp);
  });

  test("defaults to newest first and paginates with skip/limit", async () => {
    const q = fakeQuery([]);
    Instructor.find.mockReturnValue(q);

    await instructorService.listInstructors({ page: "2", limit: "5" });

    expect(q.calls.sort).toContain("-createdAt");
    expect(q.calls.skip).toContain(5);
    expect(q.calls.limit).toContain(5);
  });
});

describe("getInstructorBySlug", () => {
  test("returns the profile when the slug exists", async () => {
    const profile = { slug: "mona-123abc", headline: "Math teacher" };
    Instructor.findOne.mockReturnValue(fakeQuery(profile));

    const result = await instructorService.getInstructorBySlug("mona-123abc");

    expect(Instructor.findOne).toHaveBeenCalledWith({ slug: "mona-123abc" });
    expect(result).toBe(profile);
  });

  test("throws a 404 error when the slug does not exist", async () => {
    Instructor.findOne.mockReturnValue(fakeQuery(null));

    await expect(instructorService.getInstructorBySlug("nope")).rejects.toMatchObject({
      statusCode: 404,
      message: "Instructor not found",
    });
  });
});

describe("getMyProfile", () => {
  test("throws a 404 error when the instructor has no profile yet", async () => {
    Instructor.findOne.mockReturnValue(fakeQuery(null));

    await expect(instructorService.getMyProfile("user-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("upsertMyProfile", () => {
  test("creates a new profile linked to the user when none exists", async () => {
    Instructor.findOne.mockResolvedValue(null);
    Instructor.prototype.save.mockResolvedValue(undefined);

    const result = await instructorService.upsertMyProfile("user-1", {
      headline: "Math teacher",
      bio: "Ten years of teaching",
      expertise: ["algebra"],
    });

    expect(result.user).toBe("user-1");
    expect(result.headline).toBe("Math teacher");
    expect(Instructor.prototype.save).toHaveBeenCalled();
  });

  test("updates only the provided fields on an existing profile", async () => {
    const existing = { user: "user-1", headline: "Old", bio: "Keep me", save: jest.fn() };
    Instructor.findOne.mockResolvedValue(existing);

    const result = await instructorService.upsertMyProfile("user-1", { headline: "New" });

    expect(result.headline).toBe("New");
    expect(result.bio).toBe("Keep me");
    expect(existing.save).toHaveBeenCalled();
  });

  test("ignores fields that are not whitelisted, like user or slug", async () => {
    Instructor.findOne.mockResolvedValue(null);
    Instructor.prototype.save.mockResolvedValue(undefined);

    const result = await instructorService.upsertMyProfile("user-1", {
      headline: "Math teacher",
      user: "someone-else",
      slug: "fake-slug",
      role: "admin",
    });

    expect(result.user).toBe("user-1");
    expect(result.slug).toBeUndefined();
    expect(result.role).toBeUndefined();
  });
});
