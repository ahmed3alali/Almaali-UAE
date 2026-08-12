export type AppView = 'main' | 'blog' | 'blog-post' | 'admin';

/** Normalize pathname (strip trailing slash except root). */
export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** Admin only when path is exactly /admin — never via hash, query, or accidents. */
export function isAdminPath(pathname: string = window.location.pathname): boolean {
  return normalizePath(pathname) === '/admin';
}

export function resolveViewFromLocation(
  pathname: string = window.location.pathname,
  hash: string = window.location.hash
): { view: AppView; postId: string | null } {
  if (isAdminPath(pathname)) {
    return { view: 'admin', postId: null };
  }

  // If someone lands on /admin by mistake then navigates home, hash must not resurrect admin
  if (hash === '#blog') {
    return { view: 'blog', postId: null };
  }
  if (hash.startsWith('#blog-') && hash !== '#blog') {
    return { view: 'blog-post', postId: hash.slice(6) };
  }

  return { view: 'main', postId: null };
}
