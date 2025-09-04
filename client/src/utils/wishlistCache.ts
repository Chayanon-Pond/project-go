const KEY_PREFIX = "wishlist_ids_";

function key(userId?: string | null) {
  return `${KEY_PREFIX}${userId || "anonymous"}`;
}

export function getWishlistIds(userId?: string | null): Set<string> {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function setWishlistIds(ids: Set<string>, userId?: string | null) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(Array.from(ids)));
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
  } catch {}
}

export function addWishlistId(id: string, userId?: string | null) {
  const ids = getWishlistIds(userId);
  ids.add(id);
  setWishlistIds(ids, userId);
}

export function removeWishlistId(id: string, userId?: string | null) {
  const ids = getWishlistIds(userId);
  ids.delete(id);
  setWishlistIds(ids, userId);
}
