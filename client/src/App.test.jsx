import { render } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";

import App from "./App";
import userReducer from "./redux/userSlice";

describe("App", () => {
  test("renders application", () => {
    const store = configureStore({
      reducer: {
        user: userReducer,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </Provider>
    );

    expect(document.body).toBeTruthy();
  });
});