"use server";

import { getExploreDirectory } from "@/lib/explore/directory";
import type {
  RestroomDetail,
  SiblingRestroom,
} from "@/lib/restroom-directory/schemas";

export type LoadRestroomDetailResult =
  | {
      ok: true;
      detail: RestroomDetail;
      siblings: SiblingRestroom[];
    }
  | { ok: false; error: "not_found" | "failed" };

/**
 * Loads listing detail + active siblings for the Explore detail shell.
 * Guests allowed. Archived/missing → not_found.
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

  return {
    ok: true,
    detail: detailResult.value,
    siblings,
  };
}
