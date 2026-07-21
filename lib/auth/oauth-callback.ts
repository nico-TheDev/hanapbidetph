export type OAuthExchangeResult =
  | { ok: true }
  | { ok: false; message: string };

export type OAuthCallbackInput = {
  origin: string;
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  exchange?: OAuthExchangeResult;
};

/**
 * Decides where `/auth/callback` should send the browser after OAuth return.
 * Tokens stay in HTTP-only cookies set during code exchange — never in the redirect URL.
 */
export function resolveOAuthCallbackRedirect(
  input: OAuthCallbackInput,
): string {
  const { origin, code, error, exchange } = input;

  if (error) {
    return `${origin}/login?error=${encodeURIComponent(error)}`;
  }

  if (!code) {
    return `${origin}/login?error=missing_code`;
  }

  if (exchange && !exchange.ok) {
    return `${origin}/login?error=${encodeURIComponent(exchange.message)}`;
  }

  return `${origin}/`;
}
