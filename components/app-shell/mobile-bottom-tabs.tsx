"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinned, PlusCircle, Star, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { APP_TABS, resolveActiveTab, type AppTabHref } from "@/lib/app-shell/tabs";
import { cn } from "@/lib/utils";

const TAB_ICONS: Record<AppTabHref, LucideIcon> = {
  "/": MapPinned,
  "/add": PlusCircle,
  "/profile": UserRound,
  "/reviews": Star,
};

export function MobileBottomTabs() {
  const pathname = usePathname();
  const active = resolveActiveTab(pathname);

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {APP_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.href];
          const isActive = active === tab.href;
          return (
            <li key={tab.href} className="min-w-0">
              <Link
                href={tab.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="size-5 shrink-0"
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden
                />
                <span className="truncate">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
