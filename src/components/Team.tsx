/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Doctor, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, resolveImage, whatsappDoctorMessage } from '../lib/images';
import { localeText } from '../lib/i18n';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';
import ContentStatus from './ui/ContentStatus';
import { cn } from '../lib/utils';

interface TeamProps {
  lang: Language;
  doctors: Doctor[];
  isLoading?: boolean;
}

export default function Team({ lang, doctors, isLoading = true }: TeamProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const reduced = useReducedMotion();
  const fallbacks = [IMAGES.placeholders.doctor, IMAGES.testimonials.t2, IMAGES.testimonials.t3];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el || doctors.length === 0) return;
      const next = ((index % doctors.length) + doctors.length) % doctors.length;
      const card = el.querySelectorAll<HTMLElement>('[data-doctor-card]')[next];
      if (!card) return;

      // Scroller is forced LTR so offsetLeft is stable across page RTL
      const target =
        card.offsetLeft - Math.max(0, (el.clientWidth - card.offsetWidth) / 2);
      el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      setActiveIndex(next);
    },
    [doctors.length]
  );

  const syncActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || doctors.length === 0) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-doctor-card]'));
    if (!cards.length) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }, [doctors.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncActiveFromScroll();
    el.addEventListener('scroll', syncActiveFromScroll, { passive: true });
    window.addEventListener('resize', syncActiveFromScroll);
    return () => {
      el.removeEventListener('scroll', syncActiveFromScroll);
      window.removeEventListener('resize', syncActiveFromScroll);
    };
  }, [syncActiveFromScroll, doctors]);

  return (
    <section id="team" className="section-pad relative overflow-hidden bg-bg-dark bg-dark-grain text-bg-light">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -end-20 top-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <div className="container-premium relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <SectionReveal className="lg:col-span-7">
            <p className="text-eyebrow text-gold">{t.teamSectionTitle}</p>
            <TextReveal
              text={t.teamSectionSubtitle}
              className="mt-4 font-display text-display-sm"
            />
            {!isLoading && doctors.length > 0 && (
              <p className="mt-4 text-sm text-bg-light/50">
                {isRtl ? `${doctors.length} أطباء في الفريق` : `${doctors.length} clinicians on the team`}
              </p>
            )}
          </SectionReveal>
          <SectionReveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
            <h3 className="font-display text-2xl text-gold">{t.teamTrustTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bg-light/65">{t.teamTrustDesc}</p>
            {!isLoading && doctors.length > 1 && (
              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={isRtl ? 'السابق' : 'Previous'}
                  onClick={() => goToIndex(activeIndex - 1)}
                  className="inline-flex h-11 w-11 items-center justify-center border border-white/15 text-bg-light transition hover:border-gold hover:text-gold"
                >
                  {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
                <button
                  type="button"
                  aria-label={isRtl ? 'التالي' : 'Next'}
                  onClick={() => goToIndex(activeIndex + 1)}
                  className="inline-flex h-11 w-11 items-center justify-center border border-white/15 text-bg-light transition hover:border-gold hover:text-gold"
                >
                  {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
            )}
          </SectionReveal>
        </div>
      </div>

      {isLoading ? (
        <div className="container-premium relative mt-14">
          <ContentStatus
            lang={lang}
            status="loading"
            tone="dark"
            className="border border-white/10 bg-white/[0.03]"
          />
        </div>
      ) : doctors.length === 0 ? (
        <div className="container-premium relative mt-14">
          <ContentStatus
            lang={lang}
            status="empty"
            tone="dark"
            className="border border-white/10 bg-white/[0.03]"
          />
        </div>
      ) : (
        <div className="relative mt-14">
          <div
            ref={scrollerRef}
            dir="ltr"
            className={cn(
              'flex gap-5 overflow-x-auto scroll-smooth pb-4 pt-1',
              'snap-x snap-mandatory',
              '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'ps-[max(1.25rem,calc((100%-min(100%,72rem))/2+1.25rem))] pe-[max(1.25rem,calc((100%-min(100%,72rem))/2+1.25rem))]'
            )}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {doctors.map((doctor, index) => (
              <motion.article
                key={doctor.id}
                data-doctor-card
                dir={isRtl ? 'rtl' : 'ltr'}
                className={cn(
                  'group relative w-[min(82vw,22rem)] shrink-0 snap-center overflow-hidden rounded-[1.75rem] bg-white/5 sm:w-[20rem] lg:w-[22rem]',
                  activeIndex === index && 'ring-1 ring-gold/35'
                )}
                whileHover={reduced ? undefined : { y: -8 }}
                transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <SafeImage
                    src={resolveImage(doctor.image, fallbacks[index % fallbacks.length])}
                    alt={localeText(doctor.name, lang)}
                    fallback={fallbacks[index % fallbacks.length]}
                    className="h-full w-full img-grade transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110"
                    parallax
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bronze/40 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                    {localeText(doctor.role, lang)}
                  </p>
                  <h3 className="mt-2 font-display text-3xl">{localeText(doctor.name, lang)}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-bg-light/75 opacity-90 transition duration-500 md:line-clamp-none md:max-h-0 md:overflow-hidden md:opacity-0 md:group-hover:max-h-40 md:group-hover:opacity-100">
                    {localeText(doctor.bio, lang)}
                  </p>
                  <a
                    href={whatsappDoctorMessage(localeText(doctor.name, lang), lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-bg-light/90"
                  >
                    <span>{lang === 'ar' ? 'عرض التفاصيل عبر واتساب' : 'View details on WhatsApp'}</span>
                    <ArrowUpRight size={14} className="shrink-0" />
                  </a>
                </div>
              </motion.article>
            ))}
          </div>

          {doctors.length > 1 && (
            <div className="container-premium mt-8 flex items-center justify-center gap-2">
              {doctors.map((doctor, index) => (
                <button
                  key={doctor.id}
                  type="button"
                  aria-label={localeText(doctor.name, lang)}
                  aria-current={activeIndex === index}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    activeIndex === index ? 'w-8 bg-gold' : 'w-1.5 bg-white/25 hover:bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
