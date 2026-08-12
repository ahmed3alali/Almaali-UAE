/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, WHATSAPP } from '../lib/images';
import AnimatedCounter from './ui/AnimatedCounter';
import MagneticButton from './ui/MagneticButton';
import SafeImage from './ui/SafeImage';

interface HeroProps {
  lang: Language;
}

export default function Hero({ lang }: HeroProps) {
  const t = TRANSLATIONS[lang];
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);
  const scaleBg = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);

  const titleParts =
    lang === 'ar'
      ? { before: 'ابتسامتك هي ', accent: 'توقيعك', after: ' الفريد' }
      : { before: 'Your Smile is Your ', accent: 'Unique', after: ' Signature' };

  const stats = [
    { value: 20, suffix: '×', label: t.heroPrecise, detail: lang === 'ar' ? 'توجيه ميكرومتري رقمي' : '3D & Micro Guidance' },
    { value: 100, suffix: '%', label: t.heroRelax, detail: lang === 'ar' ? 'خالي تمامًا من القلق' : 'Anxiety-Free Sanctuary' },
    { value: 1, suffix: '', label: t.heroExperience, detail: lang === 'ar' ? 'باقات وخدمات حصرية' : 'Elite Concierge Care' },
  ];

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden bg-bg-dark text-bg-light"
    >
      <motion.div style={reduced ? undefined : { y, scale: scaleBg }} className="absolute inset-0">
        <SafeImage
          src={IMAGES.hero}
          alt={lang === 'ar' ? 'بهو عيادات المعالي الفاخر' : 'Al Maali luxury clinic lobby'}
          className="h-full w-full scale-105 img-grade"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/80 via-bg-dark/55 to-bg-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(196,165,116,0.2),transparent_45%)]" />
      </motion.div>

      <motion.div
        style={reduced ? undefined : { opacity }}
        className="relative z-10 flex min-h-[100svh] flex-col justify-end pb-16 pt-36 md:pb-24 md:pt-40"
      >
        <div className="container-premium">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="text-eyebrow text-gold"
          >
            {t.tagline}
          </motion.p>

          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 48, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-5xl font-display text-display text-balance"
          >
            {titleParts.before}
            <motion.em
              className="not-italic text-gold"
              animate={reduced ? undefined : { opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              {titleParts.accent}
            </motion.em>
            {titleParts.after}
          </motion.h1>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.45 }}
            className="mt-6 max-w-2xl text-body-lg leading-relaxed text-bg-light/75"
          >
            {t.heroSubtitle}
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <MagneticButton href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" variant="dark">
              {t.heroCTA}
            </MagneticButton>
            <a
              href="#about"
              className="link-draw text-sm font-bold uppercase tracking-[0.16em] text-bg-light/80"
            >
              {t.navAbout}
            </a>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.75 }}
            className="mt-14 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-3"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="min-w-0"
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 + i * 0.1 }}
              >
                <div className="font-display text-4xl text-gold md:text-5xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="mt-2 text-sm font-bold text-bg-light">{stat.label}</div>
                <div className="mt-1 text-xs text-bg-light/55">{stat.detail}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.a
          href="#about"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-bg-light/50 md:flex"
          animate={reduced ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Scroll
          <ChevronDown size={16} />
        </motion.a>
      </motion.div>
    </section>
  );
}
