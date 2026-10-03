import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("react-circular-progressbar", () => ({
  CircularProgressbar: ({ value, text }) => (
    <div data-testid="progress" data-value={value}>
      {text}
    </div>
  ),
  buildStyles: vi.fn(() => ({})),
}));

import Timer from "../src/components/timer.jsx";

describe("Timer", () => {
  it("renders the remaining seconds", () => {
    render(<Timer timeleft={60} totalTime={120} />);

    expect(screen.getByText("60s")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "50");
  });

  it("shows 100 percent at the beginning", () => {
    render(<Timer timeleft={90} totalTime={90} />);
    expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "100");
  });

  it("shows 0 percent when time is over", () => {
    render(<Timer timeleft={0} totalTime={90} />);
    expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "0");
  });
});
