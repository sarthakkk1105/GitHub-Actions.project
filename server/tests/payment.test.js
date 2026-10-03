import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/payment.model.js", () => {
  class Payment {}
  Payment.create = vi.fn();
  Payment.findOne = vi.fn();
  return { default: Payment };
});

vi.mock("../models/user.model.js", () => {
  class User {}
  User.findByIdAndUpdate = vi.fn();
  return { default: User };
});

vi.mock("../services/Razorpay.service.js", () => ({
  default: {
    orders: {
      create: vi.fn(),
    },
  },
}));

import app from "../app.js";
import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import razorpay from "../services/Razorpay.service.js";

const token = jwt.sign(
  { id: "507f1f77bcf86cd799439011" },
  process.env.JWT_SECRET,
  { expiresIn: "1h" },
);

const auth = (req) => req.set("Cookie", `token=${token}`);

describe("Payment order API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a Razorpay order and payment record", async () => {
    razorpay.orders.create.mockResolvedValue({
      id: "order_test_123",
      amount: 50000,
      currency: "INR",
    });
    Payment.create.mockResolvedValue({
      razorpayOrderId: "order_test_123",
      status: "created",
    });

    const res = await auth(request(app)
      .post("/api/payment/order")
      .send({ planId: "pro", amount: 500, credits: 650 }));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("order_test_123");
    expect(razorpay.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50000,
        currency: "INR",
      }),
    );
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: "pro",
        amount: 500,
        credits: 650,
        razorpayOrderId: "order_test_123",
        status: "created",
      }),
    );
  });

  it.each([
    { amount: 0, credits: 100 },
    { amount: 100, credits: 0 },
    { amount: null, credits: 100 },
    { amount: 100, credits: null },
  ])("rejects invalid plan data: %o", async (body) => {
    const res = await auth(request(app).post("/api/payment/order").send(body));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid plan data.");
  });

  it("returns 500 when Razorpay fails", async () => {
    razorpay.orders.create.mockRejectedValue(new Error("Razorpay down"));

    const res = await auth(request(app)
      .post("/api/payment/order")
      .send({ planId: "pro", amount: 500, credits: 650 }));

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe("Payment verification API", () => {
  beforeEach(() => vi.clearAllMocks());

  const signatureFor = (orderId, paymentId) =>
    crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

  it("rejects an invalid signature", async () => {
    const res = await auth(request(app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "wrong",
      }));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("invalid payment signature");
    expect(Payment.findOne).not.toHaveBeenCalled();
  });

  it("returns 404 when the payment record does not exist", async () => {
    Payment.findOne.mockResolvedValue(null);

    const orderId = "order_123";
    const paymentId = "pay_123";

    const res = await auth(request(app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signatureFor(orderId, paymentId),
      }));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payment not found");
  });

  it("does not credit the user twice for an already paid payment", async () => {
    Payment.findOne.mockResolvedValue({ status: "paid" });

    const orderId = "order_123";
    const paymentId = "pay_123";

    const res = await auth(request(app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signatureFor(orderId, paymentId),
      }));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Already processed");
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("marks the payment paid and credits the user", async () => {
    const payment = {
      userId: "507f1f77bcf86cd799439011",
      credits: 650,
      status: "created",
      save: vi.fn(async function save() {
        return this;
      }),
    };
    Payment.findOne.mockResolvedValue(payment);
    User.findByIdAndUpdate.mockResolvedValue({
      _id: payment.userId,
      credits: 750,
    });

    const orderId = "order_123";
    const paymentId = "pay_123";

    const res = await auth(request(app)
      .post("/api/payment/verify")
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signatureFor(orderId, paymentId),
      }));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(payment.status).toBe("paid");
    expect(payment.razorpayPaymentId).toBe(paymentId);
    expect(payment.save).toHaveBeenCalled();
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      payment.userId,
      { $inc: { credits: 650 } },
      { new: true },
    );
  });
});
