export const END_USER_ROUTES = [
  "/",
  "/add",
  "/profile",
  "/reviews",
  "/restrooms/[id]",
  "/login",
] as const;

export const APP_TABS = [
  { href: "/", label: "Explore" },
  { href: "/add", label: "Add CR" },
  { href: "/profile", label: "Profile" },
  { href: "/reviews", label: "Reviews" },
] as const;

export type AppTabHref = (typeof APP_TABS)[number]["href"];

export function resolveActiveTab(pathname: string): AppTabHref | null {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return null;
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }
  if (pathname === "/add" || pathname.startsWith("/add/")) {
    return "/add";
  }
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return "/profile";
  }
  if (pathname === "/reviews" || pathname.startsWith("/reviews/")) {
    return "/reviews";
  }
  if (pathname === "/" || pathname.startsWith("/restrooms/")) {
    return "/";
  }
  return null;
}

export function isAppShellPath(pathname: string): boolean {
  return resolveActiveTab(pathname) !== null;
}
