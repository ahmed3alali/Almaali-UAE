/**
 * Locale-aware routing for /ar and /en (SEO-friendly URLs).
 */
import type { Language } from '../types';

export type AppView = 'main' | 'blog' | 'blog-post' | 'admin';

export const LOCALES: Language[] = ['ar', 'en'];
export const DEFAULT_LOCALE: Language = 'ar';

/** Normalize pathname (strip trailing slash except root). */
export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function isLocale(value: string): value is Language {
  return value === 'ar' || value === 'en';
}

/** Admin only when path is exactly /admin */
export function isAdminPath(pathname: string = window.location.pathname): boolean {
  return normalizePath(pathname) === '/admin';
}

export function localeHome(locale: Language): string {
  return `/${locale}`;
}

export function localeBlogPath(locale: Language, postId?: string | null): string {
  if (postId) return `/${locale}/blog/${encodeURIComponent(postId)}`;
  return `/${locale}/blog`;
}

/** Swap /ar ↔ /en while keeping the rest of the path. */
export function switchLocaleInPath(pathname: string, nextLocale: Language): string {
  const path = normalizePath(pathname);
  if (isAdminPath(path)) return path;
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return `/${nextLocale}`;
  if (isLocale(parts[0])) {
    parts[0] = nextLocale;
    return `/${parts.join('/')}`;
  }
  return `/${nextLocale}${path === '/' ? '' : path}`;
}

export type LocationState = {
  locale: Language;
  view: AppView;
  postId: string | null;
  /** If set, App should replaceState to this path (e.g. / → /ar). */
  redirectTo: string | null;
};

/**
 * Resolve locale + view from URL.
 * Preferred: /ar, /en, /ar/blog, /en/blog/:id
 * Legacy hash: #blog, #blog-:id (kept working under a locale prefix)
 */
export function resolveViewFromLocation(
  pathname: string = window.location.pathname,
  hash: string = window.location.hash,
  search: string = window.location.search
): LocationState {
  const path = normalizePath(pathname);

  if (isAdminPath(path)) {
    return { locale: DEFAULT_LOCALE, view: 'admin', postId: null, redirectTo: null };
  }

  // Bare `/` → default locale home
  if (path === '/') {
    return {
      locale: DEFAULT_LOCALE,
      view: 'main',
      postId: null,
      redirectTo: `/${DEFAULT_LOCALE}${search}${hash || ''}`,
    };
  }

  const parts = path.split('/').filter(Boolean);
  const first = parts[0] || '';

  // Missing locale prefix on a public path → prefix with default
  if (!isLocale(first)) {
    return {
      locale: DEFAULT_LOCALE,
      view: 'main',
      postId: null,
      redirectTo: `/${DEFAULT_LOCALE}${path}${search}${hash || ''}`,
    };
  }

  const locale = first;
  const rest = parts.slice(1);

  // Legacy hash blog routes under /ar or /en
  if (hash === '#blog') {
    return {
      locale,
      view: 'blog',
      postId: null,
      redirectTo: localeBlogPath(locale),
    };
  }
  if (hash.startsWith('#blog-') && hash !== '#blog') {
    const id = hash.slice(6);
    return {
      locale,
      view: 'blog-post',
      postId: id,
      redirectTo: localeBlogPath(locale, id),
    };
  }

  if (rest.length === 0) {
    return { locale, view: 'main', postId: null, redirectTo: null };
  }

  if (rest[0] === 'blog') {
    if (rest.length === 1) {
      return { locale, view: 'blog', postId: null, redirectTo: null };
    }
    const postId = decodeURIComponent(rest[1] || '');
    return {
      locale,
      view: 'blog-post',
      postId: postId || null,
      redirectTo: null,
    };
  }

  // Unknown subpath under locale → locale home
  return {
    locale,
    view: 'main',
    postId: null,
    redirectTo: `/${locale}`,
  };
}
