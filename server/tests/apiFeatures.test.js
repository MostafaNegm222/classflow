const ApiFeatures = require("../src/utils/apiFeatures");

// Minimal chainable stand-in for a Mongoose query: records the calls made on it.
function fakeQuery() {
  const calls = { find: [], sort: [], select: [], skip: [], limit: [] };
  const q = {
    calls,
    find(arg) { calls.find.push(arg); return q; },
    sort(arg) { calls.sort.push(arg); return q; },
    select(arg) { calls.select.push(arg); return q; },
    skip(arg) { calls.skip.push(arg); return q; },
    limit(arg) { calls.limit.push(arg); return q; },
  };
  return q;
}

describe("ApiFeatures.filter", () => {
  test("passes plain equality params through", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { role: "trainee" }).filter();
    expect(q.calls.find[0]).toEqual({ role: "trainee" });
  });

  test("converts gte/gt/lte/lt operators to Mongo operators", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { rating: { gte: "4", lt: "5" } }).filter();
    expect(q.calls.find[0]).toEqual({ rating: { $gte: "4", $lt: "5" } });
  });

  test("strips reserved keys so they are not treated as filters", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { page: "2", sort: "name", limit: "5", fields: "name", search: "x", role: "trainee" }).filter();
    expect(q.calls.find[0]).toEqual({ role: "trainee" });
  });
});

describe("ApiFeatures.search", () => {
  test("does nothing without a search keyword", () => {
    const q = fakeQuery();
    new ApiFeatures(q, {}).search(["name"]);
    expect(q.calls.find).toHaveLength(0);
  });

  test("builds a case-insensitive $or over the given fields plus slug", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { search: "mona" }).search(["name", "bio"]);
    const condition = q.calls.find[0];
    expect(condition.$or).toHaveLength(3);
    expect(condition.$or[0].name).toBeInstanceOf(RegExp);
    expect(condition.$or[2].slug).toBeInstanceOf(RegExp);
    expect(condition.$or[0].name.test("MONA")).toBe(true);
  });
});

describe("ApiFeatures.sort", () => {
  test("defaults to newest first", () => {
    const q = fakeQuery();
    new ApiFeatures(q, {}).sort();
    expect(q.calls.sort[0]).toBe("-createdAt");
  });

  test("turns a comma list into a space list", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { sort: "-createdAt,name" }).sort();
    expect(q.calls.sort[0]).toBe("-createdAt name");
  });
});

describe("ApiFeatures.paginate", () => {
  test("defaults to page 1 with 20 items", () => {
    const q = fakeQuery();
    new ApiFeatures(q, {}).paginate();
    expect(q.calls.skip[0]).toBe(0);
    expect(q.calls.limit[0]).toBe(20);
  });

  test("computes skip from page and limit", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { page: "3", limit: "10" }).paginate();
    expect(q.calls.skip[0]).toBe(20);
    expect(q.calls.limit[0]).toBe(10);
  });

  test("clamps a negative page to the first page", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { page: "-2" }).paginate();
    expect(q.calls.skip[0]).toBe(0);
  });

  test("treats a zero limit as unset and falls back to the default", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { limit: "0" }).paginate();
    expect(q.calls.limit[0]).toBe(20);
  });
});

describe("chaining", () => {
  test("filter().sort().paginate() runs on one query in order", () => {
    const q = fakeQuery();
    new ApiFeatures(q, { role: "trainee", sort: "name", page: "2", limit: "5" })
      .filter().sort().paginate();
    expect(q.calls.find[0]).toEqual({ role: "trainee" });
    expect(q.calls.sort[0]).toBe("name");
    expect(q.calls.skip[0]).toBe(5);
    expect(q.calls.limit[0]).toBe(5);
  });
});
