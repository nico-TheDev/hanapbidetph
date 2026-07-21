import { getUser } from "@/lib/auth";

import { RestroomDetailClient } from "./restroom-detail-client";

type RestroomDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
};

/**
 * Deep-link / OAuth return target for listing detail.
 * `?action=verify` resumes the interrupted Verify CTA (ticket 32).
 */
export default async function RestroomDetailPage({
  params,
  searchParams,
}: RestroomDetailPageProps) {
  const { id } = await params;
  const { action } = await searchParams;
  const user = await getUser();

  return (
    <RestroomDetailClient
      listingId={id}
      isSignedIn={Boolean(user)}
      resumeAction={action ?? null}
    />
  );
}
