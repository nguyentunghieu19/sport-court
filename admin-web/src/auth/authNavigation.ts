export function roleHome(role: string): string {
  if (role === "ADMIN") return "/admin";
  if (role === "OWNER" || role === "STAFF") return "/manage";
  return "/";
}

/** Only accept local destinations and never return to the authentication screens. */
export function safeReturnTo(value: string | null, origin: string = window.location.origin): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  try {
    const target = new URL(value, origin);
    const pathname = decodeURIComponent(target.pathname);
    if (target.origin !== origin || /^\/(login|register(?:-owner)?)(?:\/|$)/i.test(pathname)) return null;
    return target.pathname + target.search + target.hash;
  } catch {
    return null;
  }
}
