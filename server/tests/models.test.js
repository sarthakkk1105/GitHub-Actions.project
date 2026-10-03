import { describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

vi.mock("../services/Razorpay.service.js", () => ({ default: {} }));
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import Payment from "../models/payment.model.js";

const oid = new mongoose.Types.ObjectId();

describe("User model", () => {
  it("requires name and email", async () => {
    const user = new User({});
    await expect(user.validate()).rejects.toThrow();
  });

  it("defaults credits to 100", () => {
    const user = new User({ name: "Sarthak", email: "sarthak@example.com" });
    expect(user.credits).toBe(100);
  });

  it("accepts a custom credit balance", () => {
    const user = new User({
      name: "Sarthak",
      email: "sarthak@example.com",
      credits: 650,
    });
    expect(user.credits).toBe(650);
  });
});

describe("Interview model", () => {
  it("requires userId, role, experience and mode", async () => {
    const interview = new Interview({});
    await expect(interview.validate()).rejects.toThrow();
  });

  it.each(["Technical", "HR"])("accepts mode %s", async (mode) => {
    const interview = new Interview({
      userId: oid,
      role: "Developer",
      experience: "Fresher",
      mode,
    });
    await expect(interview.validate()).resolves.toBeUndefined();
  });

  it("rejects an unsupported interview mode", async () => {
    const interview = new Interview({
      userId: oid,
      role: "Developer",
      experience: "Fresher",
      mode: "SomethingElse",
    });
    await expect(interview.validate()).rejects.toThrow();
  });

  it("defaults finalscore and status", () => {
    const interview = new Interview({
      userId: oid,
      role: "Developer",
      experience: "Fresher",
      mode: "Technical",
    });

    expect(interview.finalscore).toBe(0);
    expect(interview.status).toBe("Incomplete");
  });
});

describe("Payment model", () => {
  it("requires userId", async () => {
    const payment = new Payment({ amount: 500, credits: 650 });
    await expect(payment.validate()).rejects.toThrow();
  });

  it.each(["created", "paid", "failed"])("accepts status %s", async (status) => {
    const payment = new Payment({ userId: oid, status });
    await expect(payment.validate()).resolves.toBeUndefined();
  });

  it("rejects an invalid payment status", async () => {
    const payment = new Payment({ userId: oid, status: "unknown" });
    await expect(payment.validate()).rejects.toThrow();
  });
});
