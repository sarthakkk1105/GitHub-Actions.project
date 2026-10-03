import request from "supertest";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../models/user.model.js", () => {
  class User {
    constructor(data = {}) {
      Object.assign(this, data);
    }

    async save() {
      return this;
    }
  }

  User.findById = vi.fn();
  return { default: User };
});

vi.mock("../models/interview.model.js", () => {
  class Interview {
    constructor(data = {}) {
      Object.assign(this, data);
      this._id = this._id || "507f1f77bcf86cd799439012";
    }

    async save() {
      return this;
    }
  }

  Interview.create = vi.fn();
  Interview.findById = vi.fn();
  Interview.find = vi.fn();

  return { default: Interview };
});

vi.mock("../services/openrouter.services.js", () => ({
  askAi: vi.fn(),
}));

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(async () => ({
        getTextContent: vi.fn(async () => ({
          items: [{ str: "React Node MongoDB JavaScript" }],
        })),
      })),
    }),
  })),
}));

import app from "../app.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";
import { askAi } from "../services/openrouter.services.js";

const tokenFor = (id = "507f1f77bcf86cd799439011") =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });

const auth = (req) => req.set("Cookie", `token=${tokenFor()}`);

const makeInterview = () => {
  const interview = {
    _id: "507f1f77bcf86cd799439012",
    userId: "507f1f77bcf86cd799439011",
    questions: [
      {
        question: "Tell me about your React project.",
        timeLimit: 60,
        score: 8,
        confidence: 8,
        communication: 7,
        correctness: 9,
        answer: "I built a React app.",
        feedback: "Good answer.",
      },
      {
        question: "Explain Express middleware.",
        timeLimit: 60,
        score: 7,
        confidence: 7,
        communication: 8,
        correctness: 7,
        answer: "Middleware handles requests.",
        feedback: "Clear explanation.",
      },
    ],
    finalscore: 0,
    status: "Incomplete",
    save: vi.fn(async function save() {
      return this;
    }),
  };
  return interview;
};

describe("Resume analysis", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a request without a resume", async () => {
    const res = await auth(request(app).post("/api/interview/resume"));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Resume file is required");
  });

  it("extracts resume text and returns mocked AI analysis", async () => {
    askAi.mockResolvedValue(
      JSON.stringify({
        role: "Full Stack Developer",
        experience: "Fresher",
        projects: ["InterviewIQ.AI"],
        skills: ["React", "Node.js"],
      }),
    );

    const res = await auth(request(app).post("/api/interview/resume"))
      .attach("resume", Buffer.from("fake pdf bytes"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("Full Stack Developer");
    expect(res.body.experience).toBe("Fresher");
    expect(res.body.projects).toEqual(["InterviewIQ.AI"]);
    expect(res.body.skills).toEqual(["React", "Node.js"]);
    expect(res.body.resumeText).toContain("React Node MongoDB JavaScript");
  });

  it("returns 500 when the AI response is not valid JSON", async () => {
    askAi.mockResolvedValue("not-json");

    const res = await auth(request(app).post("/api/interview/resume"))
      .attach("resume", Buffer.from("fake pdf bytes"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal server error");
  });
});

describe("Generate interview questions", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    [{ experience: "Fresher", mode: "Technical" }],
    [{ role: "Developer", mode: "Technical" }],
    [{ role: "Developer", experience: "Fresher" }],
    [{ role: "", experience: "Fresher", mode: "Technical" }],
    [{ role: "Developer", experience: "", mode: "Technical" }],
    [{ role: "Developer", experience: "Fresher", mode: "" }],
  ])("rejects incomplete input: %o", async (payload) => {
    const res = await auth(request(app)
      .post("/api/interview/generate-questions")
      .send(payload));

    expect(res.status).toBe(400);
  });

  it("rejects a user with fewer than 50 credits", async () => {
    User.findById.mockResolvedValue({ credits: 49 });

    const res = await auth(request(app)
      .post("/api/interview/generate-questions")
      .send({ role: "Developer", experience: "Fresher", mode: "Technical" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Not enough credits/i);
    expect(askAi).not.toHaveBeenCalled();
  });

  it("rejects a missing user", async () => {
    User.findById.mockResolvedValue(null);

    const res = await auth(request(app)
      .post("/api/interview/generate-questions")
      .send({ role: "Developer", experience: "Fresher", mode: "Technical" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User not found.");
  });

  it("generates five questions, applies difficulty/time rules and deducts 50 credits", async () => {
    const user = {
      _id: "507f1f77bcf86cd799439011",
      name: "Sarthak",
      credits: 100,
      save: vi.fn(async function save() {
        return this;
      }),
    };
    User.findById.mockResolvedValue(user);
    askAi.mockResolvedValue(
      [
        "Explain your React project architecture.",
        "How do you manage state in your applications?",
        "How would you secure an Express API?",
        "Explain how MongoDB indexes improve performance.",
        "Design a scalable full stack interview platform.",
        "Extra question should be ignored.",
      ].join("\n"),
    );

    const created = {
      _id: "507f1f77bcf86cd799439012",
      questions: [],
    };
    Interview.create.mockImplementation(async (data) => {
      created.questions = data.questions;
      return created;
    });

    const res = await auth(request(app)
      .post("/api/interview/generate-questions")
      .send({
        role: "Full Stack Developer",
        experience: "Fresher",
        mode: "Technical",
        projects: ["InterviewIQ.AI"],
        skills: ["React", "Node.js"],
        resumeText: "React Node MongoDB",
      }));

    expect(res.status).toBe(200);
    expect(res.body.interviewId).toBe(created._id);
    expect(res.body.creditsLeft).toBe(50);
    expect(res.body.userName).toBe("Sarthak");
    expect(created.questions).toHaveLength(5);
    expect(created.questions.map((q) => q.difficulty)).toEqual([
      "easy",
      "easy",
      "medium",
      "medium",
      "hard",
    ]);
    expect(created.questions.map((q) => q.timeLimit)).toEqual([60, 60, 90, 90, 120]);
    expect(user.credits).toBe(50);
    expect(user.save).toHaveBeenCalled();
  });

  it("returns 500 for an empty AI response", async () => {
    User.findById.mockResolvedValue({ credits: 100 });
    askAi.mockResolvedValue("   ");

    const res = await auth(request(app)
      .post("/api/interview/generate-questions")
      .send({ role: "Developer", experience: "Fresher", mode: "Technical" }));

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("AI returned empty response.");
  });
});

describe("Submit answer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scores an empty answer as zero", async () => {
    const interview = makeInterview();
    Interview.findById.mockResolvedValue(interview);

    const res = await auth(request(app)
      .post("/api/interview/submit-answer")
      .send({
        interviewId: interview._id,
        questionIndex: 0,
        answer: "",
        timetaken: 20,
      }));

    expect(res.status).toBe(200);
    expect(res.body.feedback).toBe("You did not submit an answer.");
    expect(interview.questions[0].score).toBe(0);
    expect(interview.save).toHaveBeenCalled();
    expect(askAi).not.toHaveBeenCalled();
  });

  it("rejects an answer that exceeds the question time limit", async () => {
    const interview = makeInterview();
    Interview.findById.mockResolvedValue(interview);

    const res = await auth(request(app)
      .post("/api/interview/submit-answer")
      .send({
        interviewId: interview._id,
        questionIndex: 0,
        answer: "My answer",
        timetaken: 61,
      }));

    expect(res.status).toBe(200);
    expect(res.body.feedback).toContain("Time limit exceeded");
    expect(interview.questions[0].score).toBe(0);
    expect(interview.questions[0].answer).toBe("My answer");
    expect(askAi).not.toHaveBeenCalled();
  });

  it("evaluates and saves a valid answer", async () => {
    const interview = makeInterview();
    Interview.findById.mockResolvedValue(interview);
    askAi.mockResolvedValue(
      JSON.stringify({
        confidence: 8,
        communication: 9,
        correctness: 7,
        finalScore: 8,
        feedback: "Good answer with clear structure and relevant examples.",
      }),
    );

    const res = await auth(request(app)
      .post("/api/interview/submit-answer")
      .send({
        interviewId: interview._id,
        questionIndex: 0,
        answer: "I built a React application with reusable components.",
        timetaken: 30,
      }));

    expect(res.status).toBe(200);
    expect(res.body.feedback).toContain("Good answer");
    expect(interview.questions[0]).toMatchObject({
      confidence: 8,
      communication: 9,
      correctness: 7,
      score: 8,
    });
    expect(interview.save).toHaveBeenCalled();
  });

  it("returns 500 when the AI returns invalid JSON", async () => {
    const interview = makeInterview();
    Interview.findById.mockResolvedValue(interview);
    askAi.mockResolvedValue("invalid-json");

    const res = await auth(request(app)
      .post("/api/interview/submit-answer")
      .send({
        interviewId: interview._id,
        questionIndex: 0,
        answer: "My answer",
        timetaken: 20,
      }));

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/failed to sybmit answer/i);
  });
});

describe("Finish interview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calculates averages and completes the interview", async () => {
    const interview = makeInterview();
    Interview.findById.mockResolvedValue(interview);

    const res = await auth(request(app)
      .post("/api/interview/finish")
      .send({ interviewId: interview._id }));

    expect(res.status).toBe(200);
    expect(res.body.finalScore).toBe(7.5);
    expect(res.body.confidence).toBe(7.5);
    expect(res.body.communication).toBe(7.5);
    expect(res.body.correctness).toBe(8);
    expect(res.body.questionWiseScore).toHaveLength(2);
    expect(interview.status).toBe("completed");
    expect(interview.finalscore).toBe(7.5);
    expect(interview.save).toHaveBeenCalled();
  });

  it("returns 400 when the interview does not exist", async () => {
    Interview.findById.mockResolvedValue(null);

    const res = await auth(request(app)
      .post("/api/interview/finish")
      .send({ interviewId: "507f1f77bcf86cd799439012" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Failed to find interview.");
  });
});

describe("Interview history", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns interviews for the current user in newest-first order", async () => {
    const records = [
      { _id: "2", role: "React", createdAt: "2026-10-03T10:00:00.000Z" },
      { _id: "1", role: "Node", createdAt: "2026-10-02T10:00:00.000Z" },
    ];

    const query = {
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(records),
    };
    Interview.find.mockReturnValue(query);

    const res = await auth(request(app).get("/api/interview/get-interview"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.select).toHaveBeenCalled();
  });

  it("returns an empty history when the user has no interviews", async () => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([]),
    };
    Interview.find.mockReturnValue(query);

    const res = await auth(request(app).get("/api/interview/get-interview"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("Interview report", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns aggregate report metrics", async () => {
    const interview = makeInterview();
    Interview.findById.mockResolvedValue(interview);

    const res = await auth(
      request(app).get(`/api/interview/report/${interview._id}`),
    );

    expect(res.status).toBe(200);
    expect(res.body.finalScore).toBe(7.5);
    expect(res.body.confidence).toBe(7.5);
    expect(res.body.communication).toBe(7.5);
    expect(res.body.correctness).toBe(8);
    expect(res.body.questionWiseScore).toHaveLength(2);
  });
});
