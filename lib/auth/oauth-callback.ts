import { safeReturnPath } from "./return-path";

export type OAuthExchangeResult =
  | { ok: true }
  | { ok: false; message: string };

export type OAuthCallbackInput = {
  origin: string;
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  /** Interrupted route captured before OAuth (e.g. `/add`, `/reviews`). */
  next?: string | null;
  exchange?: OAuthExchangeResult;
};

function loginErrorRedirect(
  origin: string,
  error: string,
  next: string | null | undefined,
): string {
  const params = new URLSearchParams({ error });
  const returnTo = safeReturnPath(next);
  if (returnTo !== "/") {
    params.set("next", returnTo);
  }
  return `${origin}/login?${params.toString()}`;
}

/**
 * Decides where `/auth/callback` should send the browser after OAuth return.
 * Tokens stay in HTTP-only cookies set during code exchange — never in the redirect URL.
 */
export function resolveOAuthCallbackRedirect(
  input: OAuthCallbackInput,
): string {
  const { origin, code, error, next, exchange } = input;

  if (error) {
    return loginErrorRedirect(origin, error, next);
  }

  if (!code) {
    return loginErrorRedirect(origin, "missing_code", next);
  }

  if (exchange && !exchange.ok) {
    return loginErrorRedirect(origin, exchange.message, next);
  }

  return `${origin}${safeReturnPath(next)}`;
}
