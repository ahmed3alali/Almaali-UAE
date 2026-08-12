/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { GalleryCategory, GalleryItem, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, resolveImage } from '../lib/images';
import { categoryLabel, DEFAULT_GALLERY_CATEGORIES } from '../lib/galleryCategories';
import { localeText } from '../lib/i18n';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';
import ContentStatus from './ui/ContentStatus';
import { cn } from '../lib/utils';

interface GalleryProps {
  lang: Language;
  galleryItems: GalleryItem[];
  galleryCategories?: GalleryCategory[];
  isLoading?: boolean;
}

export default function Gallery({
  lang,
  galleryItems,
  galleryCategories = DEFAULT_GALLERY_CATEGORIES,
  isLoading = true,
}: GalleryProps) {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<string>('all');

  const filters = useMemo(() => {
    const cats =
      galleryCategories.length > 0 ? galleryCategories : DEFAULT_GALLERY_CATEGORIES;
    return [
      { id: 'all', label: t.galleryFilterAll },
      ...cats.map((c) => ({ id: c.id, label: c.label[lang] })),
    ];
  }, [galleryCategories, lang, t.galleryFilterAll]);

  const items = useMemo(
    () => (filter === 'all' ? galleryItems : galleryItems.filter((g) => g.category === filter)),
    [filter, galleryItems]
  );

  return (
    <section id="gallery" className="section-pad bg-grain">
      <div className="container-premium">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionReveal className="max-w-2xl">
            <p className="text-eyebrow text-bronze">{t.gallerySectionTitle}</p>
            <TextReveal
              text={t.gallerySectionSubtitle}
              className="mt-4 font-display text-display-sm text-ink"
            />
          </SectionReveal>
          {!isLoading && galleryItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition',
                    filter === f.id
                      ? 'bg-ink text-bg-light'
                      : 'border border-ink/10 text-ink-soft hover:border-bronze hover:text-bronze'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <ContentStatus
            lang={lang}
            status="loading"
            className="mt-12 border border-ink/8 bg-bg-light/60"
          />
        ) : galleryItems.length === 0 ? (
          <ContentStatus
            lang={lang}
            status="empty"
            className="mt-12 border border-ink/8 bg-bg-light/60"
          />
        ) : items.length === 0 ? (
          <ContentStatus
            lang={lang}
            status="empty"
            className="mt-12 border border-ink/8 bg-bg-light/60"
          />
        ) : (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <SectionReveal
                key={item.id}
                delay={index * 0.05}
                className={cn(index % 5 === 0 && 'md:col-span-2 md:aspect-auto')}
              >
                <figure className="group relative overflow-hidden rounded-3xl">
                  <div className={cn('overflow-hidden', index % 5 === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]')}>
                    <SafeImage
                      src={resolveImage(item.image, IMAGES.placeholders.clinic)}
                      alt={localeText(item.title, lang)}
                      className="h-full w-full transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110 img-grade"
                      parallax
                    />
                  </div>
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-dark/90 to-transparent p-6 text-bg-light">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                      {categoryLabel(galleryCategories, item.category, lang)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl">{localeText(item.title, lang)}</h3>
                    {item.description && localeText(item.description, lang) ? (
                      <p className="mt-2 max-h-0 overflow-hidden text-sm text-bg-light/70 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
                        {localeText(item.description, lang)}
                      </p>
                    ) : null}
                  </figcaption>
                </figure>
              </SectionReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
