import { describe, expect, it, vi } from "vitest";

import { getSession, getUser } from "./session";

describe("getSession / getUser helpers", () => {
  it("getSession returns the cookie-backed session for Server Actions", async () => {
    const session = {
      access_token: "jwt-access",
      refresh_token: "jwt-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: { id: "user-1", email: "maria@example.com" },
    };

    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session },
          error: null,
        }),
        getUser: vi.fn(),
      },
    };

    await expect(getSession(client)).resolves.toEqual(session);
  });

  it("getSession returns null when there is no session", async () => {
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null,
        }),
        getUser: vi.fn(),
      },
    };

    await expect(getSession(client)).resolves.toBeNull();
  });

  it("getUser returns the authenticated user for Server Actions", async () => {
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

    await expect(getUser(client)).resolves.toEqual(user);
  });

  it("getUser returns null when the user is anonymous", async () => {
    const client = {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    };

    await expect(getUser(client)).resolves.toBeNull();
  });
});
