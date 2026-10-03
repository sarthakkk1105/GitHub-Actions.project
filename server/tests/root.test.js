import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

describe("Server root API", () => {
  it("returns the health message", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Hello from the server!" });
  });

  it("returns 404 for an unknown endpoint", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});
