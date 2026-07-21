import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/app/login/google-sign-in-button";
import { safeReturnPath } from "@/lib/auth/auth-gate";
import { loginErrorMessage } from "@/lib/auth/login-error";
import { getUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in · HanapBidet PH",
  description: "Continue with Google to add, verify, and rate restrooms.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.next);
  const errorMessage = loginErrorMessage(params.error);

  const user = await getUser();
  if (user) {
    redirect(returnTo);
  }

  return (
    <main className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <header className="flex flex-col gap-2 text-center">
          <p className="font-heading text-primary text-2xl font-semibold tracking-tight">
            HanapBidet PH
          </p>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Continue with Google to add, verify, and rate restrooms. Browse stays
            anonymous.
          </p>
        </header>

        {errorMessage ? (
          <div
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
            role="alert"
          >
            <p>{errorMessage}</p>
            <p className="mt-1 opacity-90">You can retry below.</p>
          </div>
        ) : null}

        <GoogleSignInButton next={returnTo} />

        <p className="text-muted-foreground text-center text-sm">
          <Link
            href={returnTo}
            className="text-primary underline-offset-4 hover:underline"
          >
            {returnTo === "/" ? "Back to Explore" : "Cancel"}
          </Link>
        </p>
      </div>
    </main>
  );
}
