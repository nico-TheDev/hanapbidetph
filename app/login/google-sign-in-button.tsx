"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { oauthCallbackHref } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  /** Interrupted route from `/login?next=…` (already sanitized by the page). */
  next?: string;
};

export function GoogleSignInButton({ next }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueWithGoogle() {
    setPending(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = oauthCallbackHref(window.location.origin, next);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={continueWithGoogle}
      >
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
