import { useEffect } from 'react';
import type { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { localeBlogPath, localeHome } from './routing';

const HREFLANG_IDS = ['seo-hreflang-ar', 'seo-hreflang-en', 'seo-hreflang-x'] as const;

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(id: string, rel: string, href: string, hreflang?: string) {
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.id = id;
    document.head.appendChild(el);
  }
  el.setAttribute('rel', rel);
  el.setAttribute('href', href);
  if (hreflang) el.setAttribute('hreflang', hreflang);
  else el.removeAttribute('hreflang');
}

function absoluteUrl(path: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${path}`;
}

type SeoInput = {
  lang: Language;
  view: 'main' | 'blog' | 'blog-post' | 'admin';
  postTitle?: string;
};

/**
 * Keep document title, description, OG tags, and hreflang in sync with /ar|/en.
 */
export function useDocumentSeo({ lang, view, postTitle }: SeoInput) {
  useEffect(() => {
    if (view === 'admin') return;

    const t = TRANSLATIONS[lang];
    const siteName = t.brandName;
    const description = t.seoDescription || t.tagline;

    let title = t.seoTitle || `${siteName} | Al Maali Clinics`;
    let path = localeHome(lang);

    if (view === 'blog') {
      title = `${t.blogSectionTitle} | ${siteName}`;
      path = localeBlogPath(lang);
    } else if (view === 'blog-post' && postTitle) {
      title = `${postTitle} | ${siteName}`;
      path = window.location.pathname;
    }

    document.title = title;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:locale', lang === 'ar' ? 'ar_AE' : 'en_AE');
    upsertMeta('property', 'og:type', view === 'blog-post' ? 'article' : 'website');
    upsertMeta('property', 'og:url', absoluteUrl(path));
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);

    const arHref = absoluteUrl(
      view === 'blog' || view === 'blog-post'
        ? switchPathLocale(window.location.pathname, 'ar')
        : localeHome('ar')
    );
    const enHref = absoluteUrl(
      view === 'blog' || view === 'blog-post'
        ? switchPathLocale(window.location.pathname, 'en')
        : localeHome('en')
    );

    upsertLink(HREFLANG_IDS[0], 'alternate', arHref, 'ar');
    upsertLink(HREFLANG_IDS[1], 'alternate', enHref, 'en');
    upsertLink(HREFLANG_IDS[2], 'alternate', arHref, 'x-default');
    upsertLink('seo-canonical', 'canonical', absoluteUrl(path));
  }, [lang, view, postTitle]);
}

function switchPathLocale(pathname: string, locale: Language): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return `/${locale}`;
  if (parts[0] === 'ar' || parts[0] === 'en') {
    parts[0] = locale;
    return `/${parts.join('/')}`;
  }
  return `/${locale}${pathname === '/' ? '' : pathname}`;
}
