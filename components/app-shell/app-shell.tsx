import type { ReactNode } from "react";

import { MobileBottomTabs } from "@/components/app-shell/mobile-bottom-tabs";

type AppShellProps = {
  children: ReactNode;
};

/**
 * End-user chrome: mobile bottom tabs; desktop left sidebar + map frame.
 * Admin and login stay outside this layout.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          aria-label="Sidebar"
          className="border-border flex min-h-0 w-full flex-col md:w-[min(24rem,40vw)] md:shrink-0 md:border-r"
        >
          <div className="flex min-h-0 flex-1 flex-col pb-16 md:pb-0">
            {children}
          </div>
        </aside>

        <section
          aria-label="Map"
          className="from-primary/8 via-background to-secondary/30 relative hidden min-h-0 flex-1 bg-gradient-to-br md:block"
          data-shell="map"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_55%)]" />
          <div className="relative flex h-full min-h-[50vh] items-center justify-center p-8">
            <p className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Map
            </p>
          </div>
        </section>
      </div>

      <MobileBottomTabs />
    </div>
  );
}
