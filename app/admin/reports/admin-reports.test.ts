import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "@/lib/restroom-directory";
import { InMemoryAuth } from "@/lib/restroom-directory/fakes/in-memory-auth";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import { InMemoryPostgres } from "@/lib/restroom-directory/fakes/in-memory-postgres";
import { InMemoryStorage } from "@/lib/restroom-directory/fakes/in-memory-storage";
import type { Actor } from "@/lib/restroom-directory/ports/auth";

import {
  parseResolveReportForm,
  reasonLabel,
  resolveOpenReport,
} from "./admin-reports";

const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REPORT = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const REPORT_NEWER = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const REPORTER = "b2222222-2222-4222-8222-222222222222";

const admin: Extract<Actor, { role: "admin" }> = {
  role: "admin",
  userId: "c3333333-3333-4333-8333-333333333333",
  displayName: "Admin A.",
  avatarUrl: null,
  isAdmin: true,
};

const user: Extract<Actor, { role: "user" }> = {
  role: "user",
  userId: REPORTER,
  displayName: "Bob B.",
  avatarUrl: null,
  isAdmin: false,
};

function createHarness(actor: Actor = admin) {
  const auth = new InMemoryAuth();
  auth.setActor(actor);
  const postgres = new InMemoryPostgres();
  const directory = createRestroomDirectory({
    auth,
    places: new InMemoryPlaces(),
    postgres,
    storage: new InMemoryStorage(),
    geolocation: new InMemoryGeolocation(),
  });
  return { directory, postgres };
}

function seedDisputedListing(postgres: InMemoryPostgres) {
  postgres.seedProfiles([
    {
      id: admin.userId,
      displayName: admin.displayName,
      avatarUrl: null,
    },
    {
      id: REPORTER,
      displayName: "Bob B.",
      avatarUrl: null,
    },
  ]);
  postgres.seedEstablishments([
    {
      id: EST,
      placeId: "ChIJ_sm_megamall",
      name: "SM Megamall",
      formattedAddress: "EDSA, Mandaluyong",
      lat: 14.585,
      lng: 121.057,
    },
  ]);
  postgres.seedRestrooms([
    {
      id: RESTROOM,
      establishmentId: EST,
      createdBy: REPORTER,
      floorArea: "2F",
      restroomLabel: "Female",
      bidetType: "manual_spray",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: false,
      accessCost: "free",
      accessScope: "public",
      status: "disputed",
      verifyCount: 0,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
  ]);
  postgres.seedReports([
    {
      id: REPORT,
      restroomId: RESTROOM,
      reporterId: REPORTER,
      reason: "doesnt_exist",
      details: "Could not find it on 2F",
      status: "open",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
  ]);
}

function toFormData(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return form;
}

describe("admin report queue helpers", () => {
  it("labels report reasons for the queue UI", () => {
    expect(reasonLabel("doesnt_exist")).toBe("Doesn't exist");
    expect(reasonLabel("wrong_location")).toBe("Wrong location");
  });

  it("parses a dismiss form", () => {
    const parsed = parseResolveReportForm(
      toFormData({
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "dismiss",
      }),
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "dismiss",
      },
    });
  });

  it("parses a review form with listing status", () => {
    const parsed = parseResolveReportForm(
      toFormData({
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "review",
        listingStatus: "closed",
      }),
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "review",
        listingStatus: "closed",
      },
    });
  });

  it("rejects review without a valid listing status", () => {
    const parsed = parseResolveReportForm(
      toFormData({
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "review",
        listingStatus: "not-a-status",
      }),
    );
    expect(parsed).toEqual({ ok: false, error: "validation_error" });
  });

  it("lists open reports oldest-first for the queue", async () => {
    const { directory, postgres } = createHarness();
    seedDisputedListing(postgres);
    postgres.seedReports([
      {
        id: REPORT_NEWER,
        restroomId: RESTROOM,
        reporterId: REPORTER,
        reason: "wrong_location",
        details: "newer",
        status: "open",
        createdAt: "2026-03-02T00:00:00.000Z",
      },
      {
        id: REPORT,
        restroomId: RESTROOM,
        reporterId: REPORTER,
        reason: "doesnt_exist",
        details: "older",
        status: "open",
        createdAt: "2026-03-01T00:00:00.000Z",
      },
    ]);

    const result = await directory.listOpenReports();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((r) => r.id)).toEqual([REPORT, REPORT_NEWER]);
    expect(result.value[0]).toMatchObject({
      restroomName: "SM Megamall",
      reason: "doesnt_exist",
      details: "older",
      reporterDisplayName: "Bob B.",
    });
  });

  it("dismisses a report and removes it from the open queue", async () => {
    const { directory, postgres } = createHarness();
    seedDisputedListing(postgres);

    const parsed = parseResolveReportForm(
      toFormData({
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "dismiss",
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const resolved = await resolveOpenReport(directory, parsed.value);
    expect(resolved).toEqual({ ok: true, value: undefined });

    const queue = await directory.listOpenReports();
    expect(queue).toEqual({ ok: true, value: [] });
    expect(postgres.reportsFor(RESTROOM)[0]?.status).toBe("dismissed");
  });

  it("marks reviewed and sets listing status via adminSetStatus", async () => {
    const { directory, postgres } = createHarness();
    seedDisputedListing(postgres);

    const parsed = parseResolveReportForm(
      toFormData({
        reportId: REPORT,
        restroomId: RESTROOM,
        action: "review",
        listingStatus: "active",
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const resolved = await resolveOpenReport(directory, parsed.value);
    expect(resolved).toEqual({ ok: true, value: undefined });

    const queue = await directory.listOpenReports();
    expect(queue).toEqual({ ok: true, value: [] });
    expect(postgres.reportsFor(RESTROOM)[0]?.status).toBe("reviewed");

    const listings = await directory.listAdminRestrooms();
    expect(listings.ok).toBe(true);
    if (!listings.ok) return;
    expect(listings.value[0]).toMatchObject({
      id: RESTROOM,
      status: "active",
    });
  });

  it("denies updateReportStatus for non-admin actors", async () => {
    const { directory, postgres } = createHarness(user);
    seedDisputedListing(postgres);

    expect(
      await directory.updateReportStatus({
        reportId: REPORT,
        status: "dismissed",
      }),
    ).toEqual({ ok: false, error: "forbidden" });
  });
});
