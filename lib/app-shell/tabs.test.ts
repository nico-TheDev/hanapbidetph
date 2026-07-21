import { describe, expect, it } from "vitest";

import {
  APP_TABS,
  END_USER_ROUTES,
  isAppShellPath,
  resolveActiveTab,
} from "./tabs";

describe("APP_TABS", () => {
  it("lists Explore, Add CR, Profile, Reviews in APPFLOW order", () => {
    expect(APP_TABS.map((tab) => tab.label)).toEqual([
      "Explore",
      "Add CR",
      "Profile",
      "Reviews",
    ]);
    expect(APP_TABS.map((tab) => tab.href)).toEqual([
      "/",
      "/add",
      "/profile",
      "/reviews",
    ]);
  });
});

describe("END_USER_ROUTES", () => {
  it("covers the v1 end-user route surface from APPFLOW", () => {
    expect(END_USER_ROUTES).toEqual([
      "/",
      "/add",
      "/profile",
      "/reviews",
      "/restrooms/[id]",
      "/login",
    ]);
  });
});

describe("resolveActiveTab", () => {
  it("highlights Explore for home and listing detail", () => {
    expect(resolveActiveTab("/")).toBe("/");
    expect(resolveActiveTab("/restrooms/abc")).toBe("/");
  });

  it("highlights Add CR, Profile, and Reviews for their routes", () => {
    expect(resolveActiveTab("/add")).toBe("/add");
    expect(resolveActiveTab("/profile")).toBe("/profile");
    expect(resolveActiveTab("/reviews")).toBe("/reviews");
  });

  it("returns null for login and admin (outside end-user chrome)", () => {
    expect(resolveActiveTab("/login")).toBeNull();
    expect(resolveActiveTab("/admin")).toBeNull();
    expect(resolveActiveTab("/admin/listings")).toBeNull();
  });
});

describe("isAppShellPath", () => {
  it("includes tab routes and listing detail, excludes login and admin", () => {
    expect(isAppShellPath("/")).toBe(true);
    expect(isAppShellPath("/add")).toBe(true);
    expect(isAppShellPath("/profile")).toBe(true);
    expect(isAppShellPath("/reviews")).toBe(true);
    expect(isAppShellPath("/restrooms/xyz")).toBe(true);
    expect(isAppShellPath("/login")).toBe(false);
    expect(isAppShellPath("/admin")).toBe(false);
    expect(isAppShellPath("/admin/reports")).toBe(false);
  });
});
