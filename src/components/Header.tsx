/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { IMAGES, WHATSAPP } from '../lib/images';
import { cn } from '../lib/utils';
import { localeBlogPath, localeHome } from '../lib/routing';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  activeSection: string;
  currentView: string;
}

const NAV = [
  { id: 'home', key: 'navHome' as const },
  { id: 'about', key: 'navAbout' as const },
  { id: 'services', key: 'navServices' as const },
  { id: 'team', key: 'navTeam' as const },
  { id: 'gallery', key: 'navGallery' as const },
  { id: 'testimonials', key: 'navTestimonials' as const },
  { id: 'blog', key: 'navBlog' as const },
];

export default function Header({ lang, setLang, activeSection, currentView }: HeaderProps) {
  const t = TRANSLATIONS[lang];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    if (id === 'blog') {
      window.history.pushState(null, '', localeBlogPath(lang));
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (currentView !== 'main') {
      window.history.pushState(null, '', localeHome(lang));
      window.dispatchEvent(new PopStateEvent('popstate'));
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
      return;
    }
    if (id === 'home') {
      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  /** Over dark hero: light type. After scroll / blog: ink on cream. */
  const overHero = !scrolled && !open && currentView === 'main';

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[60] transition-[background-color,box-shadow,border-color] duration-500',
          open
            ? 'bg-bg-dark'
            : overHero
              ? 'bg-transparent'
              : 'border-b border-ink/8 bg-bg-light/92 shadow-[0_1px_0_rgba(44,36,28,0.04)] backdrop-blur-xl'
        )}
      >
        <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-5 md:h-[80px] md:px-8 lg:px-12">
          <button
            type="button"
            onClick={() => go('home')}
            className="flex shrink-0 items-center gap-3"
            aria-label={t.brandName}
          >
            <img
              src={IMAGES.logo}
              alt=""
              className="h-9 w-9 object-contain md:h-10 md:w-10"
            />
            <span className="text-start leading-none">
              <span
                className={cn(
                  'block font-display text-[1.15rem] tracking-tight md:text-[1.25rem]',
                  overHero || open ? 'text-bg-light' : 'text-ink'
                )}
              >
                {t.brandName}
              </span>
              <span
                className={cn(
                  'mt-1 block text-[10px] font-medium tracking-[0.04em]',
                  overHero || open ? 'text-bg-light/55' : 'text-muted'
                )}
              >
                {t.brandSubtitle}
              </span>
            </span>
          </button>

          <ul className="hidden items-center gap-8 lg:flex xl:gap-10">
            {NAV.map((item) => {
              const active =
                (item.id === 'blog' && (currentView === 'blog' || currentView === 'blog-post')) ||
                activeSection === item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => go(item.id)}
                    className={cn(
                      'relative pb-1 text-[13px] font-medium tracking-wide transition-colors duration-300',
                      overHero
                        ? active
                          ? 'text-bg-light'
                          : 'text-bg-light/65 hover:text-bg-light'
                        : active
                          ? 'text-ink'
                          : 'text-ink-soft/70 hover:text-ink'
                    )}
                  >
                    {t[item.key]}
                    <span
                      className={cn(
                        'absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-400 ease-[var(--ease-out-expo)]',
                        overHero ? 'bg-gold' : 'bg-bronze',
                        active ? 'scale-x-100' : 'scale-x-0'
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 md:gap-4">
            <a
              href={lang === 'ar' ? localeHome('en') : localeHome('ar')}
              hrefLang={lang === 'ar' ? 'en' : 'ar'}
              onClick={(e) => {
                e.preventDefault();
                setLang(lang === 'ar' ? 'en' : 'ar');
              }}
              className={cn(
                'text-[12px] font-medium tracking-wide transition-colors',
                overHero || open
                  ? 'text-bg-light/70 hover:text-bg-light'
                  : 'text-ink-soft hover:text-ink'
              )}
            >
              {t.langSwitch}
            </a>

            <a
              href={WHATSAPP.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'hidden items-center border px-4 py-2 text-[12px] font-medium tracking-wide transition-colors duration-300 sm:inline-flex',
                overHero || open
                  ? 'border-bg-light/35 text-bg-light hover:border-bg-light hover:bg-bg-light hover:text-ink'
                  : 'border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-bg-light'
              )}
            >
              {t.navContact}
            </a>

            <button
              type="button"
              className={cn(
                'relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden',
                overHero || open ? 'text-bg-light' : 'text-ink'
              )}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <motion.span
                className="block h-px w-5 bg-current"
                animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="block h-px w-5 bg-current"
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-px w-5 bg-current"
                animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-bg-dark lg:hidden"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex h-[72px] items-center justify-between px-5 md:h-[80px] md:px-8">
              <span className="font-display text-lg text-bg-light">{t.brandName}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[12px] font-medium tracking-wide text-bg-light/70"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-between px-5 pb-10 md:px-8">
              <ul className="mt-6 space-y-0 border-t border-white/10">
                {NAV.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="border-b border-white/10"
                  >
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      className="w-full py-5 text-start font-display text-3xl text-bg-light transition hover:text-gold md:text-4xl"
                    >
                      {t[item.key]}
                    </button>
                  </motion.li>
                ))}
              </ul>

              <div className="space-y-4 pt-8">
                <a
                  href={WHATSAPP.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center border border-bg-light/30 px-6 py-3.5 text-[13px] font-medium tracking-wide text-bg-light transition hover:bg-bg-light hover:text-ink"
                >
                  {t.heroCTA}
                </a>
                <p className="text-center text-[12px] text-bg-light/40">{WHATSAPP.phoneDisplay}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
