import type { GalleryCategory } from '../types';

export const DEFAULT_GALLERY_CATEGORIES: GalleryCategory[] = [
  {
    id: 'clinic',
    label: { ar: 'مساحة العيادة', en: 'Boutique Space' },
  },
  {
    id: 'cases',
    label: { ar: 'حالات تجميلية', en: 'Smile Designs' },
  },
];

export function slugifyCategoryId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `cat-${Date.now()}`;
}

export function categoryLabel(
  categories: GalleryCategory[],
  categoryId: string,
  lang: 'ar' | 'en'
): string {
  const found = categories.find((c) => c.id === categoryId);
  if (found) {
    const primary = (found.label[lang] || '').trim();
    if (primary) return primary;
    const other = lang === 'ar' ? 'en' : 'ar';
    return (found.label[other] || '').trim() || categoryId;
  }
  return categoryId;
}
