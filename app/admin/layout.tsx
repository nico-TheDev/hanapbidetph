import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/app/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/admin-gate";

export const metadata: Metadata = {
  title: "Admin · HanapBidet PH",
  description: "Seed listings and moderate reports for HanapBidet PH.",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="bg-background text-foreground flex min-h-dvh">
      <aside className="border-border bg-sidebar text-sidebar-foreground flex w-56 shrink-0 flex-col gap-8 border-r px-4 py-6">
        <div className="flex flex-col gap-1 px-3">
          <Link
            href="/admin"
            className="font-heading text-primary text-lg font-semibold tracking-tight"
          >
            HanapBidet PH
          </Link>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Admin
          </p>
        </div>

        <AdminNav />

        <div className="mt-auto px-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline"
          >
            Back to Explore
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
