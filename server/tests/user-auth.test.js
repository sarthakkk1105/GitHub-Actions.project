import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

vi.mock("../models/user.model.js", () => {
  class User {}
  User.findById = vi.fn();
  return { default: User };
});

import app from "../app.js";
import User from "../models/user.model.js";

const tokenFor = (id = "507f1f77bcf86cd799439011") =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

describe("JWT middleware", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/user/getUser");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("rejects an invalid token", async () => {
    const res = await request(app)
      .get("/api/user/getUser")
      .set("Cookie", "token=not-a-jwt");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("rejects an expired token", async () => {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );

    const res = await request(app)
      .get("/api/user/getUser")
      .set("Cookie", `token=${token}`);

    expect(res.status).toBe(401);
  });
});

describe("User API", () => {
  it("returns the authenticated user", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      name: "Sarthak",
      email: "sarthak@example.com",
      credits: 100,
    };

    User.findById.mockResolvedValue(user);

    const res = await request(app)
      .get("/api/user/getUser")
      .set("Cookie", `token=${tokenFor()}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user);
  });

  it("returns 404 when the authenticated user does not exist", async () => {
    User.findById.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/user/getUser")
      .set("Cookie", `token=${tokenFor()}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("returns 500 when the user database lookup fails", async () => {
    User.findById.mockRejectedValue(new Error("DB down"));

    const res = await request(app)
      .get("/api/user/getUser")
      .set("Cookie", `token=${tokenFor()}`);

    expect(res.status).toBe(500);
  });
});
