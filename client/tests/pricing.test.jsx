import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockDispatch = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}), { virtual: true });

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from "axios";
import Pricing from "../src/pages/Pricing.jsx";

describe("Pricing page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.Razorpay = vi.fn().mockImplementation((options) => ({
      open: vi.fn(() => options),
      options,
    }));
  });

  const renderPricing = () =>
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>,
    );

  it("renders all three plans", () => {
    renderPricing();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Pro Paack")).toBeInTheDocument();
    expect(screen.getByText("Starter Pack")).toBeInTheDocument();
  });

  it("shows the correct prices and credits", () => {
    renderPricing();
    expect(screen.getByText("Rs.0")).toBeInTheDocument();
    expect(screen.getByText("Rs.500")).toBeInTheDocument();
    expect(screen.getByText("Rs.100")).toBeInTheDocument();
    expect(screen.getByText("100 Credits")).toBeInTheDocument();
    expect(screen.getByText("650 Credits")).toBeInTheDocument();
    expect(screen.getByText("150 Credits")).toBeInTheDocument();
  });

  it("selects the pro plan and starts payment", async () => {
    axios.post
      .mockResolvedValueOnce({ data: { id: "order_123", amount: 50000 } })
      .mockResolvedValueOnce({ data: { user: { name: "Sarthak", credits: 750 } } });

    renderPricing();

    const proCardText = screen.getByText("Pro Paack");
    fireEvent.click(proCardText);

    const button = await screen.findByRole("button", { name: /proceed to pay/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/payment/order"),
        expect.objectContaining({ planId: "pro", amount: 500, credits: 650 }),
        { withCredentials: true },
      );
    });

    expect(window.Razorpay).toHaveBeenCalled();
  });
});
