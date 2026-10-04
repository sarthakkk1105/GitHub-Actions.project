import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("axios", () => ({ default: { get: vi.fn() } }));

import axios from "axios";
import Interviewhistory from "../src/pages/Interviewhistory.jsx";
import InterviewReport from "../src/pages/InterviewReport.jsx";

vi.mock("../src/components/Step3repot.jsx", () => ({
  default: ({ report }) => <div data-testid="report-view">Score: {report.finalScore}</div>,
}));

describe("Interview history page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the empty history state", async () => {
    axios.get.mockResolvedValue({ data: [] });

    render(
      <MemoryRouter>
        <Interviewhistory />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No interviews found/i)).toBeInTheDocument();
    });
  });

  it("shows an interview and navigates to its report", async () => {
    axios.get.mockResolvedValue({
      data: [
        {
          _id: "abc",
          role: "Full Stack Developer",
          experience: "Fresher",
          mode: "Technical",
          createdAt: "2026-10-03T00:00:00.000Z",
          finalscore: 8,
          status: "completed",
        },
      ],
    });

    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Interviewhistory />} />
          <Route path="/report/abc" element={<div>REPORT DESTINATION</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Full Stack Developer"));
    expect(screen.getByText("REPORT DESTINATION")).toBeInTheDocument();
  });
});

describe("Interview report page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading before the API resolves", () => {
    axios.get.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/report/abc"]}>
        <Routes>
          <Route path="/report/:id" element={<InterviewReport />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading Report...")).toBeInTheDocument();
  });

  it("fetches and renders the report", async () => {
    axios.get.mockResolvedValue({ data: { finalScore: 9 } });

    render(
      <MemoryRouter initialEntries={["/report/abc"]}>
        <Routes>
          <Route path="/report/:id" element={<InterviewReport />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/interview/report/abc"),
        { withCredentials: true },
      );
      expect(screen.getByTestId("report-view")).toHaveTextContent("Score: 9");
    });
  });
});
