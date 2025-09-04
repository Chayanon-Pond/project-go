const STAR_FLAG_PREFIX = "no_star_endpoint_";

function hostKey(baseUrl: string) {
  try {
    const u = new URL(baseUrl);
    return `${STAR_FLAG_PREFIX}${u.host}`;
  } catch {
    return `${STAR_FLAG_PREFIX}${baseUrl}`;
  }
}

export function markNoStarEndpoint(baseUrl: string) {
  try { localStorage.setItem(hostKey(baseUrl), "1"); } catch {}
}

export function hasNoStarEndpoint(baseUrl: string): boolean {
  try { return localStorage.getItem(hostKey(baseUrl)) === "1"; } catch { return false; }
}
