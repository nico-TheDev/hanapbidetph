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
});
