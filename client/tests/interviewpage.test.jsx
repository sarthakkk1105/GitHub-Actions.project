import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../src/components/Step1setup.jsx", () => ({
  default: ({ onStart }) => (
    <button onClick={() => onStart({ interviewId: "1", questions: [] })}>
      Mock Setup
    </button>
  ),
}));

vi.mock("../src/components/Step2interview.jsx", () => ({
  default: ({ onFinish }) => (
    <button onClick={() => onFinish({ finalScore: 8 })}>Mock Interview</button>
  ),
}));

vi.mock("../src/components/Step3repot.jsx", () => ({
  default: ({ report }) => <div>Report: {report.finalScore}</div>,
}));

import InterviewPage from "../src/pages/InterviewPage.jsx";

describe("InterviewPage localStorage flow", () => {
  beforeEach(() => localStorage.clear());

  it("starts at step one when no saved data exists", () => {
    render(<InterviewPage />);
    expect(screen.getByRole("button", { name: "Mock Setup" })).toBeInTheDocument();
  });

  it("restores saved step and interview data", () => {
    localStorage.setItem("interviewStep", "3");
    localStorage.setItem("interviewData", JSON.stringify({ finalScore: 9 }));

    render(<InterviewPage />);

    expect(screen.getByText("Report: 9")).toBeInTheDocument();
  });
});
