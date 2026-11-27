// Tests for the Vercel serverless entry (api/[[...path]].js).
// The Express app and the DB connector are replaced with fakes so the
// handler's connection-sharing and failure behavior are checked directly.

const HANDLER_PATH = "../api/[[...path]].js";

function loadHandler({ connectImpl } = {}) {
  jest.resetModules();
  const app = jest.fn((req, res) => res.end("ok"));
  const connectDB = jest.fn(connectImpl || (() => Promise.resolve()));
  jest.doMock("../src/app", () => app);
  jest.doMock("../src/config/db", () => connectDB);
  const handler = require(HANDLER_PATH);
  return { handler, app, connectDB };
}

function fakeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end(payload) { this.body = payload; return this; },
  };
}

describe("Vercel serverless entry", () => {
  test("connects once and forwards every request to the Express app", async () => {
    const { handler, app, connectDB } = loadHandler();
    const res1 = fakeRes();
    const res2 = fakeRes();
    await handler({ url: "/api/health" }, res1);
    await handler({ url: "/api/health" }, res2);
    expect(connectDB).toHaveBeenCalledTimes(1);
    expect(app).toHaveBeenCalledTimes(2);
    expect(res1.body).toBe("ok");
    expect(res2.body).toBe("ok");
  });

  test("answers 500 when the database fails, then retries on the next request", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    let attempts = 0;
    const { handler, connectDB } = loadHandler({
      connectImpl: () => {
        attempts += 1;
        return attempts === 1 ? Promise.reject(new Error("down")) : Promise.resolve();
      },
    });
    const res1 = fakeRes();
    await handler({}, res1);
    expect(res1.statusCode).toBe(500);
    expect(res1.body).toEqual({ error: "Database unavailable" });
    const res2 = fakeRes();
    await handler({}, res2);
    expect(connectDB).toHaveBeenCalledTimes(2);
    expect(res2.body).toBe("ok");
    console.error.mockRestore();
  });
});
