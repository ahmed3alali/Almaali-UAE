/**
 * Session cache for Supabase data using sessionStorage.
 *
 * Strategy: Stale-While-Revalidate
 * - On first visit  → fetch from Supabase, cache result in sessionStorage
 * - On next visit   → serve from sessionStorage immediately (zero wait),
 *                     then revalidate in background and update if changed
 * - Cache expires when the browser tab closes (sessionStorage is tab-scoped)
 *
 * Why sessionStorage (not localStorage)?
 * - Cleared on tab close → always fresh on new sessions
 * - Not shared between tabs → no stale cross-tab conflicts
 * - Same ~5MB limit but we only store text URLs, no Base64
 */

const CACHE_KEYS = {
  blogs:   'almaali_session_blogs',
  gallery: 'almaali_session_gallery',
  doctors: 'almaali_session_doctors',
} as const;

type CacheKey = keyof typeof CACHE_KEYS;

function readCache<T>(key: CacheKey): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEYS[key]);
    if (!raw) return null;
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

function writeCache<T>(key: CacheKey, data: T[]): void {
  try {
    sessionStorage.setItem(CACHE_KEYS[key], JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

export function clearSessionCache(): void {
  Object.values(CACHE_KEYS).forEach(k => sessionStorage.removeItem(k));
}

/**
 * Returns cached data immediately (if available), then calls
 * `fetcher` in the background and invokes `onFresh` if the result differs.
 *
 * Optimized: when no cache exists, returns network data directly
 * instead of round-tripping through sessionStorage.
 */
export async function cachedFetch<T>(
  key: CacheKey,
  fetcher: () => Promise<T[] | null>,
  onFresh: (data: T[]) => void,
): Promise<T[] | null> {
  const cached = readCache<T>(key);

  if (cached && cached.length > 0) {
    // Serve cached data NOW — revalidate in background (fire-and-forget)
    fetcher().then(fresh => {
      if (!fresh || fresh.length === 0) return;
      writeCache(key, fresh);
      // Only trigger re-render if data actually changed
      const cachedStr = JSON.stringify(cached);
      const freshStr  = JSON.stringify(fresh);
      if (cachedStr !== freshStr) {
        onFresh(fresh);
      }
    }).catch(err => {
      console.warn(`[Cache] Background revalidation failed for "${key}":`, err);
    });
    return cached;
  }

  // No cache: fetch directly and return the result
  try {
    const fresh = await fetcher();
    if (fresh && fresh.length > 0) {
      writeCache(key, fresh);
      return fresh;
    }
    return null;
  } catch {
    return null;
  }
}
