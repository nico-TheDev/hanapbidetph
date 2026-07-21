import { PlaceholderPage } from "@/components/app-shell/placeholder-page";

type RestroomDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestroomDetailPage({
  params,
}: RestroomDetailPageProps) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Restroom"
      description="Listing detail (amenities, trust, photos, reviews) lands in later tickets."
    >
      <p className="text-muted-foreground text-sm">
        Listing id: <span className="text-foreground font-medium">{id}</span>
      </p>
    </PlaceholderPage>
  );
}
