import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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

vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
}));

vi.mock("../src/utils/firebase", () => ({
  auth: {},
  provider: {},
}));

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

import Auth from "../src/pages/Auth.jsx";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";

describe("Auth page", () => {
  beforeEach(() => vi.clearAllMocks());

  const renderAuth = () =>
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>,
    );

  it("renders the Google sign-in button", () => {
    renderAuth();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("signs in with Google and navigates home", async () => {
    signInWithPopup.mockResolvedValue({
      user: {
        displayName: "Sarthak",
        email: "sarthak@example.com",
      },
    });

    axios.post.mockResolvedValue({
      data: { user: { name: "Sarthak" } },
    });

    renderAuth();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/google"),
        { name: "Sarthak", email: "sarthak@example.com" },
        { withCredentials: true },
      );
    });

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("clears user state when Firebase login fails", async () => {
    signInWithPopup.mockRejectedValue(new Error("Popup closed"));

    renderAuth();
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ payload: null }));
    });
  });
});
