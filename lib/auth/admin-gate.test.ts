import { describe, expect, it, vi } from "vitest";

import { resolveAdminGate } from "./admin-gate";

function authClient(user: { id: string } | null) {
  return {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
  };
}

describe("resolveAdminGate", () => {
  it("redirects anonymous users to /", async () => {
    await expect(
      resolveAdminGate({
        auth: authClient(null),
        lookupIsAdmin: vi.fn(),
      }),
    ).resolves.toEqual({
      status: "redirect",
      href: "/",
    });
  });

  it("redirects signed-in non-admin users to /", async () => {
    const lookupIsAdmin = vi.fn().mockResolvedValue(false);
    await expect(
      resolveAdminGate({
        auth: authClient({ id: "user-1" }),
        lookupIsAdmin,
      }),
    ).resolves.toEqual({
      status: "redirect",
      href: "/",
    });
    expect(lookupIsAdmin).toHaveBeenCalledWith("user-1");
  });

  it("redirects when profiles.is_admin lookup returns false", async () => {
    await expect(
      resolveAdminGate({
        auth: authClient({ id: "user-1" }),
        lookupIsAdmin: async () => false,
      }),
    ).resolves.toEqual({
      status: "redirect",
      href: "/",
    });
  });

  it("allows admin users through when profiles.is_admin is true", async () => {
    const user = { id: "admin-1", email: "ops@example.com" };
    await expect(
      resolveAdminGate({
        auth: authClient(user),
        lookupIsAdmin: async (userId) => userId === "admin-1",
      }),
    ).resolves.toEqual({
      status: "ok",
      user,
    });
  });
});
