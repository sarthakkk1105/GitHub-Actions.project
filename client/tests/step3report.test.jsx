import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      internal: { pageSize: { getWidth: () => 210 } },
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setDrawColor: vi.fn(),
      setLineWidth: vi.fn(),
      line: vi.fn(),
      roundedRect: vi.fn(),
      text: vi.fn(),
      splitTextToSize: vi.fn((text) => [text]),
      save: vi.fn(),
      lastAutoTable: { finalY: 200 },
    })),
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

vi.mock("react-circular-progressbar", () => ({
  CircularProgressbar: ({ text }) => <div>{text}</div>,
  buildStyles: vi.fn(() => ({})),
}));

vi.mock("recharts", () => ({
  Area: () => null,
  AreaChart: ({ children }) => <div>{children}</div>,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import Step3repot from "../src/components/Step3repot.jsx";

describe("Interview report", () => {
  const report = {
    userName: "Sarthak",
    interviewId: "abc123",
    finalScore: 8,
    confidence: 8,
    communication: 7,
    correctness: 9,
    questionWiseScore: [
      {
        question: "Explain React.",
        score: 8,
        feedback: "Good answer",
      },
    ],
  };

  it("shows loading state when no report exists", () => {
    render(<Step3repot report={null} />);
    expect(screen.getByText("Loading Report...")).toBeInTheDocument();
  });

  it("renders report metrics", () => {
    render(
      <MemoryRouter>
        <Step3repot report={report} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Overall Performance/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready for job/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Communication/i)).toBeInTheDocument();
    expect(screen.getByText(/Correctness/i)).toBeInTheDocument();
    expect(screen.getByText("Explain React.")).toBeInTheDocument();
  });

  it("changes performance text for a lower score", () => {
    render(
      <MemoryRouter>
        <Step3repot report={{ ...report, finalScore: 3 }} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Significant improvement required/i)).toBeInTheDocument();
  });
});
