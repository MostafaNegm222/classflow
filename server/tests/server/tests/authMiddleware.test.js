const jwt = require("jsonwebtoken");

jest.mock("../src/models/User", () => ({ findById: jest.fn() }));
const User = require("../src/models/User");
const { protect, requireRole } = require("../src/middleware/auth");

function res() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe("requireRole", () => {
  test("calls next when the user has the role", () => {
    const next = jest.fn();
    requireRole("instructor")({ user: { role: "instructor" } }, res(), next);
    expect(next).toHaveBeenCalled();
  });

  test("rejects with 403 when the role does not match", () => {
    const r = res();
    const next = jest.fn();
    requireRole("instructor")({ user: { role: "trainee" } }, r, next);
    expect(next).not.toHaveBeenCalled();
    expect(r.statusCode).toBe(403);
  });
});

describe("protect", () => {
  const secret = "test-secret";
  beforeAll(() => { process.env.JWT_SECRET = secret; });
  afterEach(() => jest.clearAllMocks());

  test("rejects requests without a Bearer token", async () => {
    const r = res();
    const next = jest.fn();
    await protect({ headers: {} }, r, next);
    expect(r.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("rejects an invalid token", async () => {
    const r = res();
    const next = jest.fn();
    await protect({ headers: { authorization: "Bearer not-a-token" } }, r, next);
    expect(r.statusCode).toBe(401);
    expect(r.body.message).toMatch(/invalid/i);
  });

  test("rejects when the user no longer exists", async () => {
    User.findById.mockResolvedValue(null);
    const token = jwt.sign({ id: "u1" }, secret);
    const r = res();
    const next = jest.fn();
    await protect({ headers: { authorization: `Bearer ${token}` } }, r, next);
    expect(r.statusCode).toBe(401);
    expect(r.body.message).toMatch(/no longer exists/i);
  });

  test("attaches the user and calls next for a valid token", async () => {
    const user = { _id: "u1", role: "trainee" };
    User.findById.mockResolvedValue(user);
    const token = jwt.sign({ id: "u1" }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    await protect(req, res(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBe(user);
  });
});
