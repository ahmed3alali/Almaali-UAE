/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';
import { Language } from '../types';
import { SERVICES, TRANSLATIONS } from '../data';
import { IMAGES } from '../lib/images';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';

interface ServicesProps {
  lang: Language;
}

export default function Services({ lang }: ServicesProps) {
  const t = TRANSLATIONS[lang];
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = SERVICES.find((s) => s.id === activeId) || null;
  const reduced = useReducedMotion();

  return (
    <section id="services" className="section-pad relative overflow-hidden bg-bg-warm/60">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -start-24 top-20 h-72 w-72 rounded-full bg-gold/15 blur-3xl"
        animate={reduced ? undefined : { x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container-premium relative">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionReveal className="max-w-2xl">
            <p className="text-eyebrow text-bronze">{t.servicesSectionTitle}</p>
            <TextReveal
              text={t.servicesSectionSubtitle}
              className="mt-4 font-display text-display-sm text-ink"
            />
          </SectionReveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {SERVICES.map((service, index) => {
            const image = IMAGES.services[service.id] || IMAGES.placeholders.case;
            return (
              <SectionReveal key={service.id} delay={index * 0.08}>
                <motion.button
                  type="button"
                  onClick={() => setActiveId(service.id)}
                  className="group relative flex h-full min-h-[320px] w-full overflow-hidden rounded-[1.75rem] text-start md:min-h-[380px]"
                  whileHover={reduced ? undefined : { y: -8 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                >
                  <SafeImage
                    src={image}
                    alt={service.title[lang]}
                    className="absolute inset-0 h-full w-full img-grade transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/55 to-bg-dark/15" />
                  <div className="absolute inset-0 bg-bronze/0 transition duration-500 group-hover:bg-bronze/20" />

                  <div className="relative z-10 flex h-full w-full flex-col justify-end p-7 md:p-9">
                    <span className="text-eyebrow text-gold">0{index + 1}</span>
                    <h3 className="mt-3 font-display text-2xl text-bg-light md:text-3xl">
                      {service.title[lang]}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-bg-light/70 opacity-90 transition duration-500 group-hover:text-bg-light">
                      {service.description[lang]}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-5">
                      <span className="text-xs text-bg-light/60">
                        {t.servicesDurationLabel} {service.duration[lang]}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.14em] text-gold">
                        {t.servicesCTA}
                        <ArrowUpRight
                          size={14}
                          className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:rotate-180"
                        />
                      </span>
                    </div>
                  </div>
                </motion.button>
              </SectionReveal>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-bg-dark/65 p-4 backdrop-blur-md md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveId(null)}
          >
            <motion.div
              role="dialog"
              aria-modal
              initial={{ opacity: 0, y: 50, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-bg-light text-ink shadow-[var(--shadow-float)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-48 overflow-hidden md:h-56">
                <SafeImage
                  src={IMAGES.services[active.id]}
                  alt={active.title[lang]}
                  className="h-full w-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-light via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="absolute end-4 top-4 rounded-full border border-white/20 bg-bg-dark/40 p-2 text-bg-light backdrop-blur"
                  aria-label={t.servicesBack}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-7 md:p-10">
                <p className="text-eyebrow text-bronze">{t.servicesSectionTitle}</p>
                <h3 className="mt-3 font-display text-3xl md:text-4xl">{active.title[lang]}</h3>
                <p className="mt-5 leading-relaxed text-muted">{active.description[lang]}</p>
                <ul className="mt-8 space-y-3">
                  {active.details[lang].map((d, i) => (
                    <motion.li
                      key={d}
                      initial={{ opacity: 0, x: lang === 'ar' ? 12 : -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className="flex gap-3 text-sm text-ink-soft"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {d}
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-bronze">
                  {t.servicesDurationLabel} {active.duration[lang]}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
