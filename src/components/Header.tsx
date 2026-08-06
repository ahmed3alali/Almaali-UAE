/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, Languages, Phone } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import LogoAlmaali from '../assets/images/logo_almaali.png';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  activeSection: string;
  currentView?: string;
}

export default function Header({ lang, setLang, activeSection, currentView = 'main' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: t.navHome },
    { id: 'about', label: t.navAbout },
    { id: 'services', label: t.navServices },
    { id: 'team', label: t.navTeam },
    { id: 'gallery', label: t.navGallery },
    { id: 'testimonials', label: t.navTestimonials },
    { id: 'blog', label: t.navBlog },
  ];

  const handleScrollTo = (id: string) => {
    setIsMobileMenuOpen(false);

    if (id === 'blog') {
      window.location.hash = '#blog';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (window.location.pathname === '/admin') {
      window.history.pushState(null, '', '/');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
      return;
    }

    if (window.location.hash === '#blog' || window.location.hash.startsWith('#blog-') || window.location.hash === '#admin') {
      window.location.hash = '';
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // height of fixed header
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  const toggleLanguage = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full">
      {/* Top micro bar for direct contact / luxury announcement */}
      <div 
        id="top-bar"
        className="w-full bg-[#4e4033] text-[#f0e8dd] py-2 px-4 md:px-8 text-xs font-mono flex justify-between items-center z-50 relative"
      >
        <div className="flex items-center gap-4">
          <a href="tel:+966114889000" className="flex items-center gap-1.5 hover:text-[#d2b58b] transition-colors">
            <Phone size={13} className="text-[#9c7049]" />
            <span dir="ltr">+966 11 488 9000</span>
          </a>
        </div>
        <div className="hidden md:block tracking-wide">
          {t.tagline}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#9c7049] animate-pulse"></span>
          <span>{t.heroExperience}</span>
        </div>
      </div>

      {/* Main navigation header */}
      <header
        id="main-header"
        className={`w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#f0e8dd]/95 backdrop-blur-md py-3'
            : 'bg-[#f0e8dd] py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <button 
            id="logo-button"
            onClick={() => handleScrollTo('home')}
            className="flex items-center gap-3 focus:outline-none cursor-pointer group"
          >
            <img 
              src={LogoAlmaali} 
              alt="Al Maali Logo" 
              className="h-8 md:h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className={`flex flex-col ${
              lang === 'ar' ? 'items-start text-right' : 'items-start text-left'
            }`}>
              <span className="font-display text-lg md:text-xl font-bold text-[#4e4033] tracking-wide group-hover:text-[#9c7049] transition-colors">
                {t.brandName} <span className="text-[#9c7049]">.</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#9c7049] uppercase mt-0.5">
                {t.brandSubtitle}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav id="desktop-nav" className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleScrollTo(item.id)}
                className={`text-sm font-sans tracking-wide transition-colors relative py-1 cursor-pointer ${
                  activeSection === item.id
                    ? 'text-[#9c7049] font-semibold'
                    : 'text-[#4e4033]/85 hover:text-[#9c7049]'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeNavLine"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9c7049]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Controls: Language & Action button */}
          <div id="header-controls" className="hidden lg:flex items-center gap-4">
            {/* Language Switcher */}
            <button
              id="lang-switch-desktop"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#9c7049]/20 hover:border-[#9c7049] text-xs font-mono text-[#4e4033] transition-all cursor-pointer hover:bg-[#d2b58b]/10"
            >
              <Languages size={14} className="text-[#9c7049]" />
              <span>{t.langSwitch}</span>
            </button>

            {/* CTA Contact Us Button */}
            <button
              id="header-cta"
              onClick={() => handleScrollTo('footer')}
              className="flex items-center gap-2 bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] text-xs font-sans font-medium tracking-wide py-2.5 px-5 rounded-full shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer border border-[#9c7049]/30"
            >
              <Phone size={14} />
              <span>{t.navContact}</span>
            </button>
          </div>

          {/* Mobile controls (hamburger, language) */}
          <div className="flex lg:hidden items-center gap-3">
            {/* Quick Language switch on mobile */}
            <button
              id="lang-switch-mobile"
              onClick={toggleLanguage}
              className="flex items-center justify-center p-2 rounded-full border border-[#9c7049]/20 text-[#4e4033] cursor-pointer"
              aria-label="Switch Language"
            >
              <Languages size={16} className="text-[#9c7049]" />
            </button>

            {/* Mobile menu trigger */}
            <button
              id="mobile-menu-trigger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-[#4e4033] hover:text-[#9c7049] focus:outline-none cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation with AnimatePresence */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[110px] bg-[#f0e8dd] shadow-lg border-b border-[#9c7049]/20 z-30 lg:hidden font-sans"
          >
            <div className="px-4 py-6 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    id={`mobile-nav-link-${item.id}`}
                    onClick={() => handleScrollTo(item.id)}
                    className={`w-full text-left py-2.5 px-3 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer ${
                      activeSection === item.id
                        ? 'bg-[#d2b58b]/20 text-[#9c7049] font-medium'
                        : 'text-[#4e4033] hover:bg-[#d2b58b]/10'
                    }`}
                    style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
                  >
                    <span>{item.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9c7049]/40"></span>
                  </button>
                ))}
              </div>

              <div className="border-t border-[#9c7049]/20 pt-4 flex flex-col gap-3">
                {/* Mobile Contact CTA */}
                <button
                  id="mobile-nav-cta"
                  onClick={() => handleScrollTo('footer')}
                  className="w-full py-3 px-4 bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Phone size={16} />
                  <span>{t.navContact}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
