import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { getUser } from "@/lib/auth/session";

export default async function EndUserLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUser();

  return <AppShell isSignedIn={Boolean(user)}>{children}</AppShell>;
}
