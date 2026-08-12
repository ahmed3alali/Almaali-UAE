/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useReducedMotion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, WHATSAPP } from '../lib/images';
import SectionReveal from './ui/SectionReveal';
import MagneticButton from './ui/MagneticButton';
import SafeImage from './ui/SafeImage';
import TextReveal from './ui/TextReveal';

interface CTAProps {
  lang: Language;
}

export default function CTA({ lang }: CTAProps) {
  const t = TRANSLATIONS[lang];
  const reduced = useReducedMotion();

  const headline =
    lang === 'ar'
      ? 'ابدأ رحلتك عبر واتساب'
      : 'Begin your journey on WhatsApp';

  const support =
    lang === 'ar'
      ? 'منسق الضيوف الخاص بنا جاهز لتنسيق استشارتك الفاخرة بخصوصية تامة — رسالة واحدة تفصلك عن ابتسامتك.'
      : 'Our guest coordinator is ready to arrange your private luxury consultation — one message away from your signature smile.';

  return (
    <section id="contact" className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0">
        <motion.div
          className="h-full w-full"
          animate={reduced ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        >
          <SafeImage src={IMAGES.cta} alt="" className="h-full w-full opacity-35 img-grade" />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #1c1713 0%, #2a221b 45%, #3a2f26 100%)', opacity: 0.88 }}
        />
      </div>

      <div className="container-premium relative z-10">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <SectionReveal className="lg:col-span-8">
            <p className="text-eyebrow text-gold">
              {lang === 'ar' ? 'تواصل مباشر' : 'Direct Concierge'}
            </p>
            <TextReveal
              text={headline}
              className="mt-5 font-display text-display text-bg-light"
            />
            <p className="mt-6 max-w-xl text-body-lg leading-relaxed text-bg-light/70">
              {support}
            </p>
          </SectionReveal>

          <SectionReveal delay={0.1} className="lg:col-span-4 lg:justify-self-end">
            <MagneticButton
              href={WHATSAPP.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              className="w-full min-w-[240px] !px-8 !py-5 !text-base"
            >
              <MessageCircle size={20} className="shrink-0" aria-hidden />
              <span>{lang === 'ar' ? 'راسلنا على واتساب' : 'Message us on WhatsApp'}</span>
            </MagneticButton>
            <p className="mt-4 text-center text-xs text-bg-light/45 lg:text-end">
              {WHATSAPP.phoneDisplay} · {t.bookingHoursValue}
            </p>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
