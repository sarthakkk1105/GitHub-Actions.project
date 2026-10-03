import { describe, expect, it } from "vitest";
import reducer, { setUserData } from "../src/redux/userSlice.js";

describe("userSlice", () => {
  it("starts with no logged-in user", () => {
    expect(reducer(undefined, { type: "init" })).toEqual({ userData: null });
  });

  it("stores user data", () => {
    const user = { name: "Sarthak", email: "sarthak@example.com", credits: 100 };
    expect(reducer(undefined, setUserData(user))).toEqual({ userData: user });
  });

  it("clears user data when null is dispatched", () => {
    const current = { userData: { name: "Sarthak" } };
    expect(reducer(current, setUserData(null))).toEqual({ userData: null });
  });
});
