import { describe, expect, it } from "vitest";

import { resolveOAuthCallbackRedirect } from "./oauth-callback";

describe("resolveOAuthCallbackRedirect", () => {
  const origin = "http://localhost:3000";

  it("redirects to /login with error when Google returns an OAuth error", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: null,
      error: "access_denied",
      errorDescription: "The user denied access",
    });

    expect(redirect).toBe(
      "http://localhost:3000/login?error=access_denied",
    );
  });

  it("preserves next on OAuth error so retry can resume the interrupted flow", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: null,
      error: "access_denied",
      errorDescription: "The user denied access",
      next: "/reviews",
    });

    expect(redirect).toBe(
      "http://localhost:3000/login?error=access_denied&next=%2Freviews",
    );
  });

  it("redirects to /login when the authorization code is missing", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: null,
      error: null,
      errorDescription: null,
    });

    expect(redirect).toBe(
      "http://localhost:3000/login?error=missing_code",
    );
  });

  it("redirects to /login when code exchange fails", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: "auth-code",
      error: null,
      errorDescription: null,
      exchange: { ok: false, message: "invalid_grant" },
    });

    expect(redirect).toBe(
      "http://localhost:3000/login?error=invalid_grant",
    );
  });

  it("lands in the app on successful code exchange without putting tokens in the URL", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: "auth-code",
      error: null,
      errorDescription: null,
      exchange: { ok: true },
    });

    expect(redirect).toBe("http://localhost:3000/");
    expect(redirect).not.toMatch(/access_token|refresh_token|token=/i);
  });

  it("returns to the interrupted route after successful Google sign-in", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: "auth-code",
      error: null,
      errorDescription: null,
      next: "/add",
      exchange: { ok: true },
    });

    expect(redirect).toBe("http://localhost:3000/add");
    expect(redirect).not.toMatch(/access_token|refresh_token|token=/i);
  });

  it("returns to a detail contribution action after successful sign-in", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: "auth-code",
      error: null,
      errorDescription: null,
      next: "/restrooms/abc?action=verify",
      exchange: { ok: true },
    });

    expect(redirect).toBe(
      "http://localhost:3000/restrooms/abc?action=verify",
    );
  });

  it("ignores unsafe next values and falls back to home on success", () => {
    const redirect = resolveOAuthCallbackRedirect({
      origin,
      code: "auth-code",
      error: null,
      errorDescription: null,
      next: "https://evil.example/phish",
      exchange: { ok: true },
    });

    expect(redirect).toBe("http://localhost:3000/");
  });
});
