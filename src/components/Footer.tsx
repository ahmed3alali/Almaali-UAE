/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Instagram, Facebook, Mail, MapPin, Phone } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, WHATSAPP } from '../lib/images';
import SectionReveal from './ui/SectionReveal';

interface FooterProps {
  lang: Language;
}

export default function Footer({ lang }: FooterProps) {
  const t = TRANSLATIONS[lang];

  return (
    <footer id="footer" className="bg-bg-ink text-bg-light">
      <div className="container-premium section-pad !pb-12 !pt-24">
        <div className="grid gap-14 lg:grid-cols-12">
          <SectionReveal className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <img src={IMAGES.logo} alt={t.brandName} className="h-14 w-14 object-contain" />
              <div>
                <div className="font-display text-3xl">{t.brandName}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                  {t.brandSubtitle}
                </div>
              </div>
            </div>
            <p className="mt-8 max-w-md leading-relaxed text-bg-light/65">
              {t.aboutStoryParagraph1}
            </p>
          </SectionReveal>

          <SectionReveal delay={0.08} className="lg:col-span-3">
            <h3 className="text-eyebrow text-gold">{t.bookingInfoTitle}</h3>
            <ul className="mt-6 space-y-4 text-sm text-bg-light/70">
              <li className="flex gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold" />
                <span>{t.bookingAddressValue}</span>
              </li>
              <li className="flex gap-3">
                <Phone size={16} className="mt-0.5 shrink-0 text-gold" />
                <a href={WHATSAPP.tel} className="hover:text-gold">
                  {t.bookingPhoneValue}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={16} className="mt-0.5 shrink-0 text-gold" />
                <a href={`mailto:${t.bookingEmailValue}`} className="hover:text-gold">
                  {t.bookingEmailValue}
                </a>
              </li>
            </ul>
          </SectionReveal>

          <SectionReveal delay={0.12} className="lg:col-span-3 lg:col-start-10">
            <h3 className="text-eyebrow text-gold">
              {lang === 'ar' ? 'احجز استشارتك الخاصة' : 'Private Consultation'}
            </h3>
            <p className="mt-6 text-sm leading-relaxed text-bg-light/65">
              {t.bookingInfoDesc}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 hover:border-gold hover:text-gold"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 hover:border-gold hover:text-gold"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
            </div>
          </SectionReveal>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-bg-light/45 md:flex-row md:items-center md:justify-between">
          <p>{t.rightsReserved}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://masarsy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-gold"
            >
              <img src={IMAGES.masarLogo} alt="Masar" className="h-5 w-auto opacity-80" />
              {t.designedWithLove}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
