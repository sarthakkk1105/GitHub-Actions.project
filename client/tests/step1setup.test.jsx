import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from "axios";
import Step1setup from "../src/components/Step1setup.jsx";
import userReducer from "../src/redux/userSlice.js";

describe("Step1setup", () => {
  beforeEach(() => vi.clearAllMocks());

  const renderSetup = (onStart = vi.fn()) => {
    const store = configureStore({
      reducer: { user: userReducer },
      preloadedState: {
        user: { userData: { name: "Sarthak", credits: 100 } },
      },
    });

    render(
      <Provider store={store}>
        <Step1setup onStart={onStart} />
      </Provider>,
    );

    return { store, onStart };
  };

  it("renders role, experience and interview mode controls", () => {
    renderSetup();

    expect(screen.getByPlaceholderText("Enter Role...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Experience (e.g. 2 years)...")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("Technical");
    expect(screen.getByText("Click to upload resume (Optional)")).toBeInTheDocument();
  });

  it("allows the user to choose HR mode", () => {
    renderSetup();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "HR" } });
    expect(screen.getByRole("combobox")).toHaveValue("HR");
  });

  it("starts an interview and updates credits", async () => {
    const { onStart, store } = renderSetup();

    axios.post.mockResolvedValue({
      data: {
        interviewId: "interview-1",
        creditsLeft: 50,
        questions: [],
      },
    });

    fireEvent.change(screen.getByPlaceholderText("Enter Role..."), {
      target: { value: "Full Stack Developer" },
    });
    fireEvent.change(screen.getByPlaceholderText("Experience (e.g. 2 years)..."), {
      target: { value: "Fresher" },
    });

    const startButton = screen.getByRole("button", { name: /start interview/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/interview/generate-questions"),
        expect.objectContaining({
          role: "Full Stack Developer",
          experience: "Fresher",
          mode: "Technical",
        }),
        { withCredentials: true },
      );
      expect(onStart).toHaveBeenCalled();
    });

    expect(store.getState().user.userData.credits).toBe(50);
  });
});
