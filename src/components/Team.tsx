/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Doctor, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, resolveImage, whatsappDoctorMessage } from '../lib/images';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';
import ContentStatus from './ui/ContentStatus';

interface TeamProps {
  lang: Language;
  doctors: Doctor[];
  isLoading?: boolean;
}

export default function Team({ lang, doctors, isLoading = true }: TeamProps) {
  const t = TRANSLATIONS[lang];
  const reduced = useReducedMotion();
  const fallbacks = [IMAGES.placeholders.doctor, IMAGES.testimonials.t2, IMAGES.testimonials.t3];

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
          </SectionReveal>
          <SectionReveal delay={0.1} className="lg:col-span-4 lg:col-start-9">
            <h3 className="font-display text-2xl text-gold">{t.teamTrustTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-bg-light/65">{t.teamTrustDesc}</p>
          </SectionReveal>
        </div>

        {isLoading ? (
          <ContentStatus
            lang={lang}
            status="loading"
            tone="dark"
            className="mt-14 border border-white/10 bg-white/[0.03]"
          />
        ) : doctors.length === 0 ? (
          <ContentStatus
            lang={lang}
            status="empty"
            tone="dark"
            className="mt-14 border border-white/10 bg-white/[0.03]"
          />
        ) : (
          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor, index) => (
              <SectionReveal key={doctor.id} delay={index * 0.08}>
                <motion.article
                  className="group relative overflow-hidden rounded-[1.75rem] bg-white/5"
                  whileHover={reduced ? undefined : { y: -10 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <SafeImage
                      src={resolveImage(doctor.image, fallbacks[index % fallbacks.length])}
                      alt={doctor.name[lang]}
                      fallback={fallbacks[index % fallbacks.length]}
                      className="h-full w-full img-grade transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110"
                      parallax
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bronze/40 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                      {doctor.role[lang]}
                    </p>
                    <h3 className="mt-2 font-display text-3xl">{doctor.name[lang]}</h3>
                    <p className="mt-3 max-h-0 overflow-hidden text-sm leading-relaxed text-bg-light/75 opacity-0 transition-all duration-500 group-hover:max-h-40 group-hover:opacity-100">
                      {doctor.bio[lang]}
                    </p>
                    <a
                      href={whatsappDoctorMessage(doctor.name[lang], lang)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-bg-light/90"
                    >
                      {lang === 'ar' ? 'عرض التفاصيل عبر واتساب' : 'View details on WhatsApp'}
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                </motion.article>
              </SectionReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
