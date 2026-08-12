import type { Language } from '../types';

type LocaleMap = { ar?: string; en?: string } | null | undefined;

/**
 * Pick localized text with fallback to the other language when empty.
 * Fixes EN UI showing blank titles when only Arabic was filled in CMS (and vice versa).
 */
export function localeText(map: LocaleMap, lang: Language, fallback = ''): string {
  if (!map || typeof map !== 'object') return fallback;
  const primary = (map[lang] || '').trim();
  if (primary) return map[lang] as string;
  const other: Language = lang === 'ar' ? 'en' : 'ar';
  const secondary = (map[other] || '').trim();
  if (secondary) return map[other] as string;
  return fallback;
}

export function localeList(
  map: { ar?: string[]; en?: string[] } | null | undefined,
  lang: Language
): string[] {
  if (!map) return [];
  const primary = Array.isArray(map[lang]) ? map[lang]! : [];
  if (primary.length > 0) return primary;
  const other: Language = lang === 'ar' ? 'en' : 'ar';
  return Array.isArray(map[other]) ? map[other]! : [];
}
