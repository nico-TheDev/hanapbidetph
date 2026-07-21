import { AdminListingsClient } from "./listings-client";
import { loadAdminListingsAction } from "./actions";

export default async function AdminListingsPage() {
  const listings = await loadAdminListingsAction();

  return <AdminListingsClient listings={listings} />;
}
