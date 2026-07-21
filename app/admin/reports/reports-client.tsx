"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { OpenReport, RestroomStatus } from "@/lib/restroom-directory";
import { cn } from "@/lib/utils";

import {
  type AdminReportsActionState,
  resolveReportAction,
} from "./actions";
import { reasonLabel } from "./admin-reports";

const initialActionState: AdminReportsActionState = { ok: true };

const LISTING_STATUSES: { value: RestroomStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "disputed", label: "Disputed" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

type AdminReportsClientProps = {
  reports: OpenReport[];
};

export function AdminReportsClient({ reports }: AdminReportsClientProps) {
  const [state, formAction, pending] = useActionState(
    resolveReportAction,
    initialActionState,
  );

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Reports
        </h1>
        <p className="text-muted-foreground text-sm">
          Review open reports oldest first. Dismiss noise or mark reviewed and
          set the listing status.
        </p>
      </header>

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

      <section className="flex flex-col gap-3" aria-labelledby="report-queue-heading">
        <h2
          id="report-queue-heading"
          className="font-heading text-lg font-semibold tracking-tight"
        >
          Open queue
        </h2>

        {reports.length === 0 ? (
          <p className="text-muted-foreground border-border rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            No open reports.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reports.map((report) => (
              <li
                key={report.id}
                className="border-border flex flex-col gap-4 rounded-xl border px-4 py-4"
              >
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{report.restroomName}</p>
                  <p className="text-muted-foreground text-sm">
                    {reasonLabel(report.reason)}
                    {report.details ? ` · ${report.details}` : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Reported by {report.reporterDisplayName} ·{" "}
                    {formatQueueDate(report.createdAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <form action={formAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="reportId" value={report.id} />
                    <input
                      type="hidden"
                      name="restroomId"
                      value={report.restroomId}
                    />
                    <input type="hidden" name="action" value="review" />
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`listingStatus-${report.id}`}
                        className="text-sm font-medium"
                      >
                        Listing status
                      </label>
                      <select
                        id={`listingStatus-${report.id}`}
                        name="listingStatus"
                        defaultValue="active"
                        className={fieldClassName}
                        disabled={pending}
                      >
                        {LISTING_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="sm" disabled={pending}>
                      Mark reviewed
                    </Button>
                  </form>

                  <form action={formAction}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input
                      type="hidden"
                      name="restroomId"
                      value={report.restroomId}
                    />
                    <input type="hidden" name="action" value="dismiss" />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={pending}
                    >
                      Dismiss
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const fieldClassName =
  "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-3";

function formatQueueDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
