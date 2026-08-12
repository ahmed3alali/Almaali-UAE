/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { GalleryItem, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, resolveImage } from '../lib/images';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';
import { cn } from '../lib/utils';

interface GalleryProps {
  lang: Language;
  galleryItems: GalleryItem[];
  isLoading?: boolean;
}

type Filter = 'all' | 'clinic' | 'cases';

export default function Gallery({ lang, galleryItems, isLoading }: GalleryProps) {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(
    () => (filter === 'all' ? galleryItems : galleryItems.filter((g) => g.category === filter)),
    [filter, galleryItems]
  );

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t.galleryFilterAll },
    { id: 'clinic', label: t.galleryFilterClinic },
    { id: 'cases', label: t.galleryFilterCases },
  ];

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
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && items.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-ink/5" />
              ))
            : items.map((item, index) => (
                <SectionReveal
                  key={item.id}
                  delay={index * 0.05}
                  className={cn(index % 5 === 0 && 'md:col-span-2 md:aspect-auto')}
                >
                  <figure className="group relative overflow-hidden rounded-3xl">
                    <div className={cn('overflow-hidden', index % 5 === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]')}>
                      <SafeImage
                        src={resolveImage(item.image, IMAGES.placeholders.clinic)}
                        alt={item.title[lang]}
                        className="h-full w-full transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110 img-grade"
                        parallax
                      />
                    </div>
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-dark/90 to-transparent p-6 text-bg-light">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                        {item.category === 'clinic' ? t.galleryFilterClinic : t.galleryFilterCases}
                      </p>
                      <h3 className="mt-2 font-display text-2xl">{item.title[lang]}</h3>
                      {item.description && (
                        <p className="mt-2 max-h-0 overflow-hidden text-sm text-bg-light/70 opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100">
                          {item.description[lang]}
                        </p>
                      )}
                    </figcaption>
                  </figure>
                </SectionReveal>
              ))}
        </div>
      </div>
    </section>
  );
}
