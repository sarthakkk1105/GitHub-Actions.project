import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/user.model.js", () => {
  class User {
    constructor(data = {}) {
      Object.assign(this, data);
      this._id = this._id || "507f1f77bcf86cd799439011";
    }

    async save() {
      return this;
    }
  }

  User.findOne = vi.fn();

  return { default: User };
});

vi.mock("../config/token.js", () => ({
  genToken: vi.fn(),
}));

import app from "../app.js";
import User from "../models/user.model.js";
import { genToken } from "../config/token.js";

describe("Authentication API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    genToken.mockResolvedValue("test-token");
  });

  it("creates a new user and returns a token", async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/google")
      .send({ name: "Sarthak", email: "sarthak@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User authenticated successfully");
    expect(res.body.user.email).toBe("sarthak@example.com");
    expect(res.body.token).toBe("test-token");
    expect(genToken).toHaveBeenCalled();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("logs in an existing user without creating a second user", async () => {
    const existingUser = {
      _id: "507f1f77bcf86cd799439011",
      name: "Sarthak",
      email: "sarthak@example.com",
      credits: 100,
    };
    User.findOne.mockResolvedValue(existingUser);

    const res = await request(app)
      .post("/api/auth/google")
      .send({ name: "Changed Name", email: "sarthak@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(existingUser);
    expect(genToken).toHaveBeenCalledWith(existingUser._id);
  });

  it.each([
    [{ name: "Sarthak" }, "missing email"],
    [{ email: "sarthak@example.com" }, "missing name"],
    [{}, "empty body"],
  ])("does not crash for %s (%s)", async (payload) => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/google").send(payload);

    expect([200, 500]).toContain(res.status);
  });

  it("returns 500 when the database lookup fails", async () => {
    User.findOne.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .post("/api/auth/google")
      .send({ name: "Sarthak", email: "sarthak@example.com" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal Server Error");
  });

  it("logs the user out and clears the token cookie", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User logged out successfully");
    expect(res.headers["set-cookie"]).toBeDefined();
    expect(res.headers["set-cookie"].join(";")).toMatch(/token=/);
  });
});
