import { NextResponse } from "next/server";

import { resolveOAuthCallbackRedirect } from "@/lib/auth/oauth-callback";
import { createClient } from "@/lib/supabase/server";

/**
 * Completes Google OAuth (PKCE): exchanges `code` for a session stored in
 * HTTP-only cookies. Tokens never appear in the redirect URL.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error || !code) {
    return NextResponse.redirect(
      resolveOAuthCallbackRedirect({
        origin,
        code,
        error,
        errorDescription,
      }),
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
  );

  return NextResponse.redirect(
    resolveOAuthCallbackRedirect({
      origin,
      code,
      error: null,
      errorDescription: null,
      exchange: exchangeError
        ? { ok: false, message: exchangeError.message || "exchange_failed" }
        : { ok: true },
    }),
  );
}
