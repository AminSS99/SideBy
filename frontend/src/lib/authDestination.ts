/** Keep authentication inside the app, preserving the comparison brief. */
export function authDestination(requested: string | null | undefined): string {
  if (!requested || [...requested].some((character) => character === "\\" || character.charCodeAt(0) < 32)) return "/app";
  try {
    const url = new URL(requested, "https://sideby.invalid");
    if (!requested.startsWith("/") || url.origin !== "https://sideby.invalid") return "/app";
    if (url.pathname !== "/app" && !url.pathname.startsWith("/app/")) return "/app";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/app";
  }
}
