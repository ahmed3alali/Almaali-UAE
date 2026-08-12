/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion } from 'motion/react';
import { Star } from 'lucide-react';
import { Language, Testimonial } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES } from '../lib/images';
import { localeText } from '../lib/i18n';
import SectionReveal from './ui/SectionReveal';
import FloatingCard from './ui/FloatingCard';
import Marquee from './ui/Marquee';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';

interface TestimonialsProps {
  lang: Language;
  testimonials: Testimonial[];
}

function initialLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toLocaleUpperCase();
}

function Avatar({
  name,
  image,
  className,
  animate,
  delay = 0,
}: {
  name: string;
  image?: string;
  className?: string;
  animate?: boolean;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const letter = initialLetter(name);

  if (image?.trim()) {
    return (
      <motion.div
        className={className}
        animate={animate && !reduced ? { y: [0, -4, 0] } : undefined}
        transition={
          animate ? { duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' } : undefined
        }
      >
        <SafeImage src={image} alt={name} className="h-full w-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex items-center justify-center bg-bronze text-bg-light ${className || ''}`}
      animate={animate && !reduced ? { y: [0, -4, 0] } : undefined}
      transition={
        animate ? { duration: 4 + delay, repeat: Infinity, ease: 'easeInOut' } : undefined
      }
      aria-hidden
    >
      <span className="font-display text-xl font-medium leading-none md:text-2xl">{letter}</span>
    </motion.div>
  );
}

export default function Testimonials({ lang, testimonials }: TestimonialsProps) {
  const t = TRANSLATIONS[lang];
  const reduced = useReducedMotion();
  const marqueeItems =
    lang === 'ar'
      ? ['فينير سويسري', 'زراعة فورية', 'تقويم شفاف', 'تجربة منتجعية', 'خصوصية تامة']
      : ['Swiss Veneers', 'Immediate Implants', 'Clear Aligners', 'Spa Experience', 'Total Privacy'];

  return (
    <section id="testimonials" className="section-pad relative overflow-hidden bg-bg-warm/40">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <SafeImage src={IMAGES.vision} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-bg-light/90" />
      </div>

      <div className="container-premium relative">
        <SectionReveal className="max-w-3xl">
          <p className="text-eyebrow text-bronze">{t.testimonialsSectionTitle}</p>
          <TextReveal
            text={t.testimonialsSectionSubtitle}
            className="mt-4 font-display text-display-sm text-ink"
          />
        </SectionReveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => {
            const name = localeText(item.name, lang);
            const hasPhoto = Boolean(item.image?.trim());

            return (
              <SectionReveal key={item.id} delay={index * 0.1}>
                <FloatingCard className="h-full !overflow-hidden !p-0" float={index === 1}>
                  <div className="relative h-40 overflow-hidden bg-bg-warm">
                    {hasPhoto ? (
                      <SafeImage src={item.image} alt={name} className="h-full w-full" parallax />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bronze/25 via-bg-warm to-gold/20">
                        <span className="font-display text-6xl text-bronze/50 md:text-7xl">
                          {initialLetter(name)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-light via-bg-light/40 to-transparent" />
                    <Avatar
                      name={name}
                      image={hasPhoto ? item.image : undefined}
                      animate={!reduced}
                      delay={index}
                      className="absolute bottom-4 start-5 h-14 w-14 overflow-hidden rounded-full border-2 border-bg-light shadow-lg"
                    />
                  </div>
                  <div className="p-6 pt-2 md:p-8">
                    <div className="flex gap-1 text-gold">
                      {Array.from({ length: Math.max(1, Math.min(5, item.rating || 5)) }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <p className="mt-5 whitespace-pre-line font-display text-xl leading-relaxed text-ink md:text-2xl">
                      “{localeText(item.comment, lang)}”
                    </p>
                    <div className="mt-8 border-t border-ink/8 pt-5">
                      <div className="font-bold text-ink">{name}</div>
                      {localeText(item.treatment, lang) ? (
                        <div className="mt-1 text-xs text-muted">{localeText(item.treatment, lang)}</div>
                      ) : null}
                      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-bronze">
                        {t.testimonialsVerified}
                      </div>
                    </div>
                  </div>
                </FloatingCard>
              </SectionReveal>
            );
          })}
        </div>
      </div>

      <div className="relative mt-16">
        <Marquee items={marqueeItems} speed={32} />
      </div>
    </section>
  );
}
