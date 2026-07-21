"use client";

import { useRouter } from "next/navigation";

import { ExploreDetailContent } from "@/components/explore/explore-detail-content";

type RestroomDetailClientProps = {
  listingId: string;
  isSignedIn: boolean;
  resumeAction: string | null;
};

/** Deep-link listing detail with Verify resume (ticket 32). */
export function RestroomDetailClient({
  listingId,
  isSignedIn,
  resumeAction,
}: RestroomDetailClientProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
      <ExploreDetailContent
        listingId={listingId}
        distancesAvailable={false}
        isSignedIn={isSignedIn}
        resumeAction={resumeAction}
        onSelectSibling={(siblingId) => {
          router.push(`/restrooms/${siblingId}`);
        }}
      />
    </div>
  );
}
