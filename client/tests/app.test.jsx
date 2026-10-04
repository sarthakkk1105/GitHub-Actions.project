import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { userData: null } }),
  },
}));

vi.mock("../src/pages/home.jsx", () => ({ default: () => <div>HOME PAGE</div> }));
vi.mock("../src/pages/Auth.jsx", () => ({ default: () => <div>AUTH PAGE</div> }));
vi.mock("../src/pages/InterviewPage.jsx", () => ({ default: () => <div>INTERVIEW PAGE</div> }));
vi.mock("../src/pages/Interviewhistory.jsx", () => ({ default: () => <div>HISTORY PAGE</div> }));
vi.mock("../src/pages/Pricing.jsx", () => ({ default: () => <div>PRICING PAGE</div> }));
vi.mock("../src/pages/InterviewReport.jsx", () => ({ default: () => <div>REPORT PAGE</div> }));

import App from "../src/App.jsx";
import userReducer from "../src/redux/userSlice.js";
import axios from "axios";

describe("App routing and initial user fetch", () => {
  const renderApp = (path = "/") => {
    const store = configureStore({ reducer: { user: userReducer } });
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </Provider>,
    );
  };

  it.each([
    ["/", "HOME PAGE"],
    ["/auth", "AUTH PAGE"],
    ["/interview", "INTERVIEW PAGE"],
    ["/history", "HISTORY PAGE"],
    ["/pricing", "PRICING PAGE"],
    ["/report/abc", "REPORT PAGE"],
  ])("renders %s", async (path, text) => {
    renderApp(path);
    expect(screen.getByText(text)).toBeInTheDocument();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });
});
