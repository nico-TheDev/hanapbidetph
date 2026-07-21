"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import type { AdminRestroomSummary } from "@/lib/restroom-directory";
import { cn } from "@/lib/utils";

import {
  type AdminListingsActionState,
  upsertAdminListingAction,
} from "./actions";
import {
  EMPTY_LISTING_FORM,
  listingToFormValues,
  statusLabel,
  type AdminListingFormValues,
} from "./listing-form-state";

const initialActionState: AdminListingsActionState = { ok: true };

type AdminListingsClientProps = {
  listings: AdminRestroomSummary[];
};

export function AdminListingsClient({ listings }: AdminListingsClientProps) {
  const [form, setForm] = useState<AdminListingFormValues>(EMPTY_LISTING_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    upsertAdminListingAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.ok && state.savedId) {
      setSelectedId(null);
      setForm(EMPTY_LISTING_FORM);
    }
  }, [state]);

  function startCreate() {
    setSelectedId(null);
    setForm(EMPTY_LISTING_FORM);
  }

  function startEdit(listing: AdminRestroomSummary) {
    setSelectedId(listing.id);
    setForm(listingToFormValues(listing));
  }

  function updateField<K extends keyof AdminListingFormValues>(
    key: K,
    value: AdminListingFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const editing = Boolean(form.restroomId);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Listings
        </h1>
        <p className="text-muted-foreground text-sm">
          Seed and edit restroom listings for soft launch.
        </p>
      </header>

      <section className="flex flex-col gap-3" aria-labelledby="listings-table-heading">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="listings-table-heading"
            className="font-heading text-lg font-semibold tracking-tight"
          >
            Existing listings
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={startCreate}>
            New listing
          </Button>
        </div>

        {listings.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            No listings yet. Seed the first one with the form below.
          </p>
        ) : (
          <div className="border-border overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground border-border border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Floor / label</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Verifies</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => {
                  const active = selectedId === listing.id;
                  return (
                    <tr
                      key={listing.id}
                      className={cn(
                        "border-border border-b last:border-b-0",
                        active && "bg-accent/40",
                      )}
                    >
                      <td className="px-4 py-3 font-medium">{listing.name}</td>
                      <td className="text-muted-foreground px-4 py-3">
                        {[listing.floorArea, listing.restroomLabel]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-secondary text-secondary-foreground inline-flex rounded-md px-2 py-0.5 text-xs font-medium">
                          {statusLabel(listing.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {listing.verifyCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(listing)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex max-w-2xl flex-col gap-4" aria-labelledby="listing-form-heading">
        <h2
          id="listing-form-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          {editing ? "Edit listing" : "Seed new listing"}
        </h2>

        {state.message ? (
          <p
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              state.ok
                ? "border-primary/20 bg-accent text-accent-foreground"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
            role="status"
          >
            {state.message}
          </p>
        ) : null}

        <form action={formAction} className="flex flex-col gap-5">
          {form.restroomId ? (
            <input type="hidden" name="restroomId" value={form.restroomId} />
          ) : null}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Establishment</legend>
            <Field label="Establishment name" htmlFor="name" className="sm:col-span-2">
              <input
                id="name"
                name="name"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={fieldClassName}
              />
            </Field>
            <Field label="Google place ID" htmlFor="placeId" className="sm:col-span-2">
              <input
                id="placeId"
                name="placeId"
                required
                value={form.placeId}
                onChange={(e) => updateField("placeId", e.target.value)}
                className={fieldClassName}
              />
            </Field>
            <Field
              label="Formatted address"
              htmlFor="formattedAddress"
              className="sm:col-span-2"
            >
              <input
                id="formattedAddress"
                name="formattedAddress"
                value={form.formattedAddress}
                onChange={(e) => updateField("formattedAddress", e.target.value)}
                className={fieldClassName}
              />
            </Field>
            <Field label="Latitude" htmlFor="lat">
              <input
                id="lat"
                name="lat"
                required
                inputMode="decimal"
                value={form.lat}
                onChange={(e) => updateField("lat", e.target.value)}
                className={fieldClassName}
              />
            </Field>
            <Field label="Longitude" htmlFor="lng">
              <input
                id="lng"
                name="lng"
                required
                inputMode="decimal"
                value={form.lng}
                onChange={(e) => updateField("lng", e.target.value)}
                className={fieldClassName}
              />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Floor and label</legend>
            <Field label="Floor / area" htmlFor="floorArea">
              <input
                id="floorArea"
                name="floorArea"
                value={form.floorArea}
                onChange={(e) => updateField("floorArea", e.target.value)}
                className={fieldClassName}
                placeholder="3F"
              />
            </Field>
            <Field label="Restroom label" htmlFor="restroomLabel">
              <input
                id="restroomLabel"
                name="restroomLabel"
                value={form.restroomLabel}
                onChange={(e) => updateField("restroomLabel", e.target.value)}
                className={fieldClassName}
                placeholder="Female"
              />
            </Field>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Amenities and access</legend>
            <Field label="Bidet type" htmlFor="bidetType">
              <select
                id="bidetType"
                name="bidetType"
                value={form.bidetType}
                onChange={(e) => updateField("bidetType", e.target.value)}
                className={fieldClassName}
              >
                <option value="none">None</option>
                <option value="manual_spray">Manual spray</option>
                <option value="high_pressure">High pressure</option>
                <option value="built_in">Built-in</option>
              </select>
            </Field>
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={(e) =>
                  updateField(
                    "status",
                    e.target.value as AdminListingFormValues["status"],
                  )
                }
                className={fieldClassName}
              >
                <option value="active">Active</option>
                <option value="disputed">Disputed</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Access cost" htmlFor="accessCost">
              <select
                id="accessCost"
                name="accessCost"
                value={form.accessCost}
                onChange={(e) => updateField("accessCost", e.target.value)}
                className={fieldClassName}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
            <Field label="Access scope" htmlFor="accessScope">
              <select
                id="accessScope"
                name="accessScope"
                value={form.accessScope}
                onChange={(e) => updateField("accessScope", e.target.value)}
                className={fieldClassName}
              >
                <option value="public">Public</option>
                <option value="needs_patronage">Needs patronage</option>
              </select>
            </Field>
          </fieldset>

          <fieldset className="flex flex-wrap gap-4">
            <legend className="sr-only">Amenity checklist</legend>
            <input
              type="hidden"
              name="hasTissue"
              value={form.hasTissue ? "on" : ""}
            />
            <input
              type="hidden"
              name="hasSoap"
              value={form.hasSoap ? "on" : ""}
            />
            <input
              type="hidden"
              name="hasHandDrying"
              value={form.hasHandDrying ? "on" : ""}
            />
            <CheckboxField
              id="hasTissue"
              label="Tissue"
              checked={form.hasTissue}
              onChange={(checked) => updateField("hasTissue", checked)}
            />
            <CheckboxField
              id="hasSoap"
              label="Soap"
              checked={form.hasSoap}
              onChange={(checked) => updateField("hasSoap", checked)}
            />
            <CheckboxField
              id="hasHandDrying"
              label="Hand drying"
              checked={form.hasHandDrying}
              onChange={(checked) => updateField("hasHandDrying", checked)}
            />
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Seed listing"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={startCreate}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

const fieldClassName =
  "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-3";

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="border-border hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary size-4"
      />
      {label}
    </label>
  );
}
