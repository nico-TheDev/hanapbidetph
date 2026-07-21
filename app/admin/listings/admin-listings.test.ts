import { describe, expect, it } from "vitest";

import { createRestroomDirectory } from "@/lib/restroom-directory";
import { InMemoryAuth } from "@/lib/restroom-directory/fakes/in-memory-auth";
import { InMemoryGeolocation } from "@/lib/restroom-directory/fakes/in-memory-geolocation";
import { InMemoryPlaces } from "@/lib/restroom-directory/fakes/in-memory-places";
import { InMemoryPostgres } from "@/lib/restroom-directory/fakes/in-memory-postgres";
import { InMemoryStorage } from "@/lib/restroom-directory/fakes/in-memory-storage";
import type { Actor } from "@/lib/restroom-directory/ports/auth";

import {
  parseAdminUpsertForm,
  saveAdminListing,
} from "./admin-listings";

const PLACE_ID = "ChIJ_sm_megamall";
const EST = "11111111-1111-4111-8111-111111111111";
const RESTROOM = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const admin: Extract<Actor, { role: "admin" }> = {
  role: "admin",
  userId: "c3333333-3333-4333-8333-333333333333",
  displayName: "Admin A.",
  avatarUrl: null,
  isAdmin: true,
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

function formFields(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    placeId: PLACE_ID,
    name: "SM Megamall",
    formattedAddress: "EDSA, Mandaluyong",
    lat: "14.585",
    lng: "121.057",
    floorArea: "2F",
    restroomLabel: "All-gender",
    bidetType: "manual_spray",
    hasTissue: "on",
    hasSoap: "on",
    hasHandDrying: "",
    accessCost: "free",
    accessScope: "public",
    status: "active",
    ...overrides,
  };
}

function toFormData(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return form;
}

describe("admin listings form helpers", () => {
  it("parses a create form into adminUpsertRestroom input", () => {
    const parsed = parseAdminUpsertForm(toFormData(formFields()));
    expect(parsed).toEqual({
      ok: true,
      value: {
        placeId: PLACE_ID,
        name: "SM Megamall",
        formattedAddress: "EDSA, Mandaluyong",
        lat: 14.585,
        lng: 121.057,
        floorArea: "2F",
        restroomLabel: "All-gender",
        bidetType: "manual_spray",
        hasTissue: true,
        hasSoap: true,
        hasHandDrying: false,
        accessCost: "free",
        accessScope: "public",
        status: "active",
        photos: [],
      },
    });
  });

  it("parses an edit form with restroomId", () => {
    const parsed = parseAdminUpsertForm(
      toFormData(formFields({ restroomId: RESTROOM, status: "closed" })),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.restroomId).toBe(RESTROOM);
    expect(parsed.value.status).toBe("closed");
  });

  it("rejects invalid form payloads", () => {
    const parsed = parseAdminUpsertForm(
      toFormData(formFields({ placeId: "", lat: "not-a-number" })),
    );
    expect(parsed).toEqual({ ok: false, error: "validation_error" });
  });

  it("creates a seeded listing via adminUpsertRestroom", async () => {
    const { directory } = createHarness();
    const parsed = parseAdminUpsertForm(toFormData(formFields()));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const saved = await saveAdminListing(directory, parsed.value);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    const list = await directory.listAdminRestrooms();
    expect(list.ok).toBe(true);
    if (!list.ok) return;

    expect(list.value).toEqual([
      expect.objectContaining({
        id: saved.value.id,
        name: "SM Megamall",
        status: "active",
        verifyCount: 0,
        floorArea: "2F",
        restroomLabel: "All-gender",
      }),
    ]);
  });

  it("edits an existing listing via adminUpsertRestroom", async () => {
    const { directory, postgres } = createHarness();
    postgres.seedEstablishments([
      {
        id: EST,
        placeId: PLACE_ID,
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
        createdBy: admin.userId,
        floorArea: "1F",
        restroomLabel: "Female",
        bidetType: "none",
        hasTissue: false,
        hasSoap: false,
        hasHandDrying: false,
        accessCost: "paid",
        accessScope: "needs_patronage",
        status: "active",
        verifyCount: 1,
        ratingAvg: null,
        ratingCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const parsed = parseAdminUpsertForm(
      toFormData(
        formFields({
          restroomId: RESTROOM,
          floorArea: "5F",
          restroomLabel: "Family",
          status: "closed",
          bidetType: "built_in",
          hasTissue: "on",
          hasSoap: "on",
          hasHandDrying: "on",
          accessCost: "free",
          accessScope: "public",
        }),
      ),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const saved = await saveAdminListing(directory, parsed.value);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    expect(saved.value).toMatchObject({
      id: RESTROOM,
      floorArea: "5F",
      restroomLabel: "Family",
      status: "closed",
      bidetType: "built_in",
      hasTissue: true,
      hasSoap: true,
      hasHandDrying: true,
      accessCost: "free",
      accessScope: "public",
      verifyCount: 1,
    });

    const list = await directory.listAdminRestrooms();
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.value[0]).toMatchObject({
      id: RESTROOM,
      status: "closed",
      floorArea: "5F",
      restroomLabel: "Family",
      verifyCount: 1,
    });
  });
});
