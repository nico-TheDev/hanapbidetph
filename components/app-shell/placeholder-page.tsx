import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Minimal tab/page shell until feature tickets fill content. */
export function PlaceholderPage({
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col px-5 py-6 md:px-6 md:py-8">
      <header className="flex shrink-0 flex-col gap-2">
        <p className="font-heading text-primary text-sm font-semibold tracking-wide uppercase">
          HanapBidet PH
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight md:text-[1.75rem]">
          {title}
        </h1>
        <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
          {description}
        </p>
      </header>
      {children ? (
        <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      ) : null}
    </main>
  );
}
