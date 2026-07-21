import { describe, expect, it, vi } from "vitest";

import {
  loginHref,
  oauthCallbackHref,
  resolveAuthGate,
  safeReturnPath,
} from "./auth-gate";

describe("auth-gate return flow", () => {
  it("builds /login with the interrupted route preserved as next", () => {
    expect(loginHref("/add")).toBe("/login?next=%2Fadd");
    expect(loginHref("/reviews")).toBe("/login?next=%2Freviews");
    expect(loginHref("/restrooms/abc?action=verify")).toBe(
      "/login?next=%2Frestrooms%2Fabc%3Faction%3Dverify",
    );
  });

  it("passes next through the OAuth callback redirectTo URL", () => {
    expect(oauthCallbackHref("http://localhost:3000")).toBe(
      "http://localhost:3000/auth/callback",
    );
    expect(oauthCallbackHref("http://localhost:3000", "/")).toBe(
      "http://localhost:3000/auth/callback",
    );
    expect(oauthCallbackHref("http://localhost:3000", "/add")).toBe(
      "http://localhost:3000/auth/callback?next=%2Fadd",
    );
    expect(
      oauthCallbackHref(
        "http://localhost:3000",
        "/restrooms/abc?action=rate",
      ),
    ).toBe(
      "http://localhost:3000/auth/callback?next=%2Frestrooms%2Fabc%3Faction%3Drate",
    );
    expect(
      oauthCallbackHref("http://localhost:3000", "https://evil.example"),
    ).toBe("http://localhost:3000/auth/callback");
  });

  it("accepts same-origin relative return paths and rejects open redirects", () => {
    expect(safeReturnPath("/add")).toBe("/add");
    expect(safeReturnPath("/restrooms/abc?action=rate")).toBe(
      "/restrooms/abc?action=rate",
    );
    expect(safeReturnPath("/profile")).toBe("/profile");
    expect(safeReturnPath("//evil.example")).toBe("/");
    expect(safeReturnPath("https://evil.example/phish")).toBe("/");
    expect(safeReturnPath(null)).toBe("/");
    expect(safeReturnPath(undefined)).toBe("/");
    expect(safeReturnPath("")).toBe("/");
  });

  it("redirects anonymous users to /login with the interrupted route preserved", async () => {
    const client = {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    await expect(resolveAuthGate("/add", client)).resolves.toEqual({
      status: "redirect",
      href: "/login?next=%2Fadd",
    });
    await expect(resolveAuthGate("/profile", client)).resolves.toEqual({
      status: "redirect",
      href: "/login?next=%2Fprofile",
    });
    await expect(resolveAuthGate("/reviews", client)).resolves.toEqual({
      status: "redirect",
      href: "/login?next=%2Freviews",
    });
    await expect(
      resolveAuthGate("/restrooms/abc?action=report", client),
    ).resolves.toEqual({
      status: "redirect",
      href: "/login?next=%2Frestrooms%2Fabc%3Faction%3Dreport",
    });
  });

  it("allows signed-in users through the gate without redirect", async () => {
    const user = { id: "user-1", email: "maria@example.com" };
    const client = {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({
          data: { user },
          error: null,
        }),
      },
    };

    await expect(resolveAuthGate("/add", client)).resolves.toEqual({
      status: "ok",
      user,
    });
  });
});
