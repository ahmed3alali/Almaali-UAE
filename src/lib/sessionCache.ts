/**
 * Session cache for site content (blogs / gallery / doctors).
 * Stale-while-revalidate for reads; admin writes update cache immediately.
 * Oversized payloads (e.g. base64 images) are not persisted — avoids quota wipeouts.
 */

const CACHE_KEYS = {
  blogs: 'almaali_session_blogs',
  gallery: 'almaali_session_gallery',
  doctors: 'almaali_session_doctors',
} as const;

const LOCAL_EDIT_AT = 'almaali_local_edit_at';
/** ~1.5MB — leave headroom under typical 5MB sessionStorage caps */
const MAX_CACHE_CHARS = 1_500_000;

export type CacheKey = keyof typeof CACHE_KEYS;

type IdItem = { id?: string; image?: string; title?: unknown; name?: unknown };

function estimateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

/** Drop inline data-URLs before caching so sessionStorage stays usable. */
function stripHeavyImages<T extends IdItem>(data: T[]): T[] {
  return data.map((item) => {
    if (typeof item.image === 'string' && item.image.startsWith('data:')) {
      return { ...item, image: '' };
    }
    return item;
  });
}

function listSignature(data: IdItem[]): string {
  return data
    .map((item) => {
      const img = item.image || '';
      const imgKey = img.startsWith('data:') ? `data:${img.length}` : img.slice(0, 80);
      return `${item.id ?? ''}|${imgKey}`;
    })
    .join('~');
}

export function readSessionCache<T>(key: CacheKey): T[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEYS[key]);
    if (!raw) return null;
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

export function writeSessionCache<T>(key: CacheKey, data: T[]): void {
  try {
    const sanitized = stripHeavyImages(data as IdItem[]) as T[];
    const payload = JSON.stringify(sanitized);
    if (payload.length > MAX_CACHE_CHARS) {
      sessionStorage.removeItem(CACHE_KEYS[key]);
      sessionStorage.setItem(LOCAL_EDIT_AT, String(Date.now()));
      return;
    }
    sessionStorage.setItem(CACHE_KEYS[key], payload);
    sessionStorage.setItem(LOCAL_EDIT_AT, String(Date.now()));
  } catch {
    try {
      sessionStorage.removeItem(CACHE_KEYS[key]);
    } catch {
      /* ignore */
    }
  }
}

export function clearSessionCache(): void {
  Object.values(CACHE_KEYS).forEach((k) => sessionStorage.removeItem(k));
  sessionStorage.removeItem(LOCAL_EDIT_AT);
}

function hasRecentLocalEdit(windowMs = 5 * 60 * 1000): boolean {
  try {
    const raw = sessionStorage.getItem(LOCAL_EDIT_AT);
    if (!raw) return false;
    return Date.now() - Number(raw) < windowMs;
  } catch {
    return false;
  }
}

/**
 * Returns cached data immediately (if available), then revalidates in background.
 * Skips applying remote data when the admin recently committed local edits.
 */
export async function cachedFetch<T extends IdItem>(
  key: CacheKey,
  fetcher: () => Promise<T[] | null>,
  onFresh: (data: T[]) => void
): Promise<T[] | null> {
  const cached = readSessionCache<T>(key);

  if (cached && cached.length > 0) {
    if (!hasRecentLocalEdit()) {
      fetcher()
        .then((fresh) => {
          if (!fresh || fresh.length === 0) return;
          if (hasRecentLocalEdit()) return;
          writeSessionCache(key, fresh);
          // Revalidation write should not block future cloud reads
          try {
            sessionStorage.removeItem(LOCAL_EDIT_AT);
          } catch {
            /* ignore */
          }
          if (listSignature(cached) !== listSignature(fresh)) {
            onFresh(fresh);
          }
        })
        .catch((err) => {
          console.warn(`[Cache] Background revalidation failed for "${key}":`, err);
        });
    }
    return cached;
  }

  try {
    const fresh = await fetcher();
    if (fresh && fresh.length > 0) {
      writeSessionCache(key, fresh);
      try {
        sessionStorage.removeItem(LOCAL_EDIT_AT);
      } catch {
        /* ignore */
      }
      return fresh;
    }
    // Explicit empty list from a successful fetch
    if (Array.isArray(fresh) && fresh.length === 0) {
      writeSessionCache(key, []);
      try {
        sessionStorage.removeItem(LOCAL_EDIT_AT);
      } catch {
        /* ignore */
      }
      return [];
    }
    return null;
  } catch {
    return null;
  }
}

export function cachePayloadTooLarge(data: unknown): boolean {
  return estimateSize(data) > MAX_CACHE_CHARS;
}
