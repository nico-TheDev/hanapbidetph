import { AdminReportsClient } from "./reports-client";
import { loadOpenReportsAction } from "./actions";

export default async function AdminReportsPage() {
  const reports = await loadOpenReportsAction();

  return <AdminReportsClient reports={reports} />;
}
