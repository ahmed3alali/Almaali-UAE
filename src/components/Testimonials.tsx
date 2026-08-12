/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion } from 'motion/react';
import { Star } from 'lucide-react';
import { Language } from '../types';
import { TESTIMONIALS, TRANSLATIONS } from '../data';
import { IMAGES } from '../lib/images';
import SectionReveal from './ui/SectionReveal';
import FloatingCard from './ui/FloatingCard';
import Marquee from './ui/Marquee';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';

interface TestimonialsProps {
  lang: Language;
}

export default function Testimonials({ lang }: TestimonialsProps) {
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
          {TESTIMONIALS.map((item, index) => (
            <SectionReveal key={item.id} delay={index * 0.1}>
              <FloatingCard className="h-full !overflow-hidden !p-0" float={index === 1}>
                <div className="relative h-40 overflow-hidden">
                  <SafeImage
                    src={IMAGES.testimonials[item.id] || IMAGES.placeholders.doctor}
                    alt={item.name[lang]}
                    className="h-full w-full"
                    parallax
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-light via-bg-light/40 to-transparent" />
                  <motion.div
                    className="absolute bottom-4 start-5 h-14 w-14 overflow-hidden rounded-full border-2 border-bg-light shadow-lg"
                    animate={reduced ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <SafeImage
                      src={IMAGES.testimonials[item.id]}
                      alt={item.name[lang]}
                      className="h-full w-full"
                    />
                  </motion.div>
                </div>
                <div className="p-6 pt-2 md:p-8">
                  <div className="flex gap-1 text-gold">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-5 font-display text-xl leading-relaxed text-ink md:text-2xl">
                    “{item.comment[lang]}”
                  </p>
                  <div className="mt-8 border-t border-ink/8 pt-5">
                    <div className="font-bold text-ink">{item.name[lang]}</div>
                    <div className="mt-1 text-xs text-muted">{item.treatment[lang]}</div>
                    <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-bronze">
                      {t.testimonialsVerified}
                    </div>
                  </div>
                </div>
              </FloatingCard>
            </SectionReveal>
          ))}
        </div>
      </div>

      <div className="relative mt-16">
        <Marquee items={marqueeItems} speed={32} />
      </div>
    </section>
  );
}
