/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion } from 'motion/react';
import { Language, VisionImages } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES } from '../lib/images';
import { staggerChildren, fadeUp, clipReveal } from '../lib/animations';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';

interface AboutProps {
  lang: Language;
  visionImages: VisionImages;
}

export default function About({ lang, visionImages }: AboutProps) {
  const t = TRANSLATIONS[lang];
  const reduced = useReducedMotion();

  const pillars = [
    { title: t.aboutPhilosophy1Title, desc: t.aboutPhilosophy1Desc },
    { title: t.aboutPhilosophy2Title, desc: t.aboutPhilosophy2Desc },
    { title: t.aboutPhilosophy3Title, desc: t.aboutPhilosophy3Desc },
  ];

  const primary = visionImages.imagePrimary || IMAGES.about;
  const secondary = visionImages.imageSecondary || IMAGES.heroAlt;

  return (
    <section id="about" className="section-pad relative overflow-hidden bg-bg-light">
      <div className="container-premium">
        {/* Header */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <SectionReveal className="lg:col-span-7">
            <p className="text-[12px] font-medium tracking-wide text-bronze">
              {t.aboutSectionTitle}
            </p>
            <h2 className="mt-3 font-display text-display-sm text-ink text-balance">
              {t.aboutSectionSubtitle}
            </h2>
          </SectionReveal>
          <SectionReveal delay={0.08} className="lg:col-span-4 lg:col-start-9">
            <p className="text-sm leading-relaxed text-muted md:text-base">
              {t.aboutStoryParagraph1}
            </p>
          </SectionReveal>
        </div>

        {/* Editorial photo — single primary + secondary, not stacked cards */}
        <div className="mt-14 grid gap-4 md:grid-cols-12 md:gap-5">
          <motion.div
            className="relative md:col-span-8 overflow-hidden"
            initial={reduced ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
            variants={clipReveal}
          >
            <SafeImage
              src={primary}
              alt={t.aboutStoryTitle}
              className="aspect-[16/11] w-full img-grade md:aspect-[16/10]"
            />
          </motion.div>

          <div className="flex flex-col gap-4 md:col-span-4">
            <motion.div
              className="relative flex-1 overflow-hidden"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <SafeImage
                src={secondary}
                alt=""
                className="aspect-[4/5] h-full min-h-[220px] w-full object-cover img-grade md:absolute md:inset-0 md:aspect-auto"
              />
            </motion.div>
            <div className="border border-ink/10 bg-bg-warm/50 px-5 py-5 md:px-6 md:py-6">
              <p className="text-[11px] font-medium tracking-wide text-bronze">
                {t.aboutStoryTitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {t.aboutStoryParagraph2}
              </p>
            </div>
          </div>
        </div>

        {/* Pillars — clean, no floating cards */}
        <motion.div
          className="mt-20 grid gap-10 border-t border-ink/10 pt-14 md:grid-cols-3 md:gap-12"
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-8%' }}
          variants={staggerChildren}
        >
          {pillars.map((p) => (
            <motion.div key={p.title} variants={fadeUp}>
              <div className="mb-5 h-px w-10 bg-bronze" />
              <h3 className="font-display text-2xl text-ink md:text-[1.75rem]">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
