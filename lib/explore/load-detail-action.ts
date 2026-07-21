"use server";

import { createSessionAuthPort } from "@/lib/restroom-directory/adapters/session-auth";
import { getExploreDirectory } from "@/lib/explore/directory";
import type {
  RestroomDetail,
  SiblingRestroom,
} from "@/lib/restroom-directory/schemas";

export type DetailViewer = {
  userId: string;
  displayName: string;
};

export type LoadRestroomDetailResult =
  | {
      ok: true;
      detail: RestroomDetail;
      siblings: SiblingRestroom[];
      viewer: DetailViewer | null;
    }
  | { ok: false; error: "not_found" | "failed" };

async function resolveViewer(): Promise<DetailViewer | null> {
  try {
    const actor = await createSessionAuthPort().getActor();
    if (actor.role === "guest") {
      return null;
    }
    return { userId: actor.userId, displayName: actor.displayName };
  } catch {
    // Vitest / no request scope — treat as guest for read-only detail loads.
    return null;
  }
}

/**
 * Loads listing detail + active siblings for the Explore detail shell.
 * Guests allowed. Archived/missing → not_found.
 * Signed-in viewer identity supports rate-form edit prefill (ticket 33).
 */
export async function loadRestroomDetailAction(
  restroomId: string,
): Promise<LoadRestroomDetailResult> {
  const directory = await getExploreDirectory();

  const detailResult = await directory.getRestroom({ id: restroomId });
  if (!detailResult.ok) {
    if (detailResult.error === "not_found") {
      return { ok: false, error: "not_found" };
    }
    return { ok: false, error: "failed" };
  }

  const siblingsResult = await directory.listSiblings({ restroomId });
  const siblings = siblingsResult.ok ? siblingsResult.value : [];
  const viewer = await resolveViewer();

  return {
    ok: true,
    detail: detailResult.value,
    siblings,
    viewer,
  };
}
