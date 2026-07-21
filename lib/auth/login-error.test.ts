import { describe, expect, it } from "vitest";

import { loginErrorMessage } from "./login-error";

describe("loginErrorMessage", () => {
  it("returns a retryable message for cancelled Google auth", () => {
    expect(loginErrorMessage("access_denied")).toMatch(/cancelled|denied|try again/i);
  });

  it("returns a retryable message for Google or exchange failures", () => {
    expect(loginErrorMessage("server_error")).toMatch(/failed|try again|retry/i);
    expect(loginErrorMessage("invalid_grant")).toMatch(/failed|try again|retry/i);
    expect(loginErrorMessage("missing_code")).toMatch(/failed|try again|retry/i);
  });

  it("returns null when there is no error", () => {
    expect(loginErrorMessage(null)).toBeNull();
    expect(loginErrorMessage(undefined)).toBeNull();
  });
});
