const CANCELLED = "Sign-in was cancelled. You can try again when you're ready.";
const FAILED =
  "Sign-in failed. Check your connection and try again with Google.";

export function loginErrorMessage(
  error: string | null | undefined,
): string | null {
  if (!error) {
    return null;
  }

  if (error === "access_denied") {
    return CANCELLED;
  }

  return FAILED;
}
