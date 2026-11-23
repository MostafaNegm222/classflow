const errorHandler = require("../src/middleware/error");

function res() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe("errorHandler", () => {
  test("uses the error statusCode when present", () => {
    const r = res();
    const err = new Error("Email already registered");
    err.statusCode = 409;
    errorHandler(err, {}, r, () => {});
    expect(r.statusCode).toBe(409);
    expect(r.body).toEqual({ message: "Email already registered" });
  });

  test("falls back to 500 and a generic message", () => {
    const r = res();
    errorHandler(new Error(), {}, r, () => {});
    expect(r.statusCode).toBe(500);
    expect(r.body).toEqual({ message: "Something went wrong" });
  });
});
