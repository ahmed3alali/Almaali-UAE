/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Phone, Mail, MapPin, Instagram, Facebook, ArrowUp, Clock, Globe } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import LogoAlmaali from '../assets/images/logo_almaali.png';
import Masarlogo from '../assets/images/masarlogo.png';

interface FooterProps {
  lang: Language;
  onOpenAdmin?: () => void;
}

export default function Footer({ lang, onOpenAdmin }: FooterProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollTo = (id: string) => {
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
    }
  };

  return (
    <footer 
      id="footer" 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className="bg-[#2a221b] text-[#f0e8dd] border-t border-[#9c7049]/40 pt-20 pb-10 relative overflow-hidden font-sans"
    >
      {/* Exquisite micro-pattern background lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] opacity-15 pointer-events-none" />
      
      {/* Decorative luxury gradient beam on top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#9c7049] to-transparent opacity-60" />

      {/* Aesthetic glowing circular radial background */}
      <div className="absolute bottom-[-100px] left-1/2 transform -translate-x-1/2 w-[500px] h-[300px] bg-[#9c7049]/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* UPPER REDESIGNED HEADER: Elegant Column with Monogram & Luxury Statement */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-14 mb-14 border-b border-[#9c7049]/15">
          
          {/* Logo & Slogan alignment */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-start">
            <img 
                src={LogoAlmaali} 
                alt="Al Maali Logo" 
                className="h-12 w-auto object-contain brightness-0 invert"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-display text-2xl font-bold tracking-wide text-[#fcf9f5]">
                  {t.brandName}
                </span>
              </div>
              <p className="text-[10px] font-mono tracking-widest text-[#9c7049] uppercase font-semibold">
                {t.brandSubtitle}
              </p>
              <p className="text-xs text-[#f0e8dd]/60 max-w-md leading-relaxed mt-1">
                {t.tagline}. {isRtl 
                  ? "ملاذ علاجي وتجميلي فريد يصيغ ملامح الثقة والتميز في كل تفصيل مجهري." 
                  : "A distinctive clinical and aesthetic sanctuary tailoring trust and prestige at every microscopic scale."}
              </p>
            </div>
          </div>

          {/* Premium Consultation Slogan / Quick Action box */}
          <div className="bg-[#4e4033]/25 border border-[#9c7049]/20 rounded-2xl p-4 sm:p-5 max-w-md w-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[#9c7049] mb-1.5 text-xs font-mono uppercase tracking-wider font-semibold">
              <Globe size={14} />
              <span>{isRtl ? "احجز استشارتك الخاصة" : "Private Consultation"}</span>
            </div>
            <p className="text-[11px] text-[#f0e8dd]/70 leading-relaxed mb-3">
              {isRtl 
                ? "ابدأ رحلة تصميم ابتسامتك المخصصة معنا باستخدام أحدث تقنيات الفحص الرقمي ثلاثي الأبعاد."
                : "Begin your customized smile journey using state-of-the-art microscopic & 3D dental diagnostics."}
            </p>
            <button 
              onClick={() => handleScrollTo('footer')}
              className="w-full sm:w-auto self-start bg-[#9c7049] hover:bg-[#b0855c] text-[#f0e8dd] text-[11px] font-semibold py-2 px-5 rounded-lg transition-all duration-300 transform hover:translate-y-[-1px] active:translate-y-0 shadow-md cursor-pointer"
            >
              {isRtl ? "تواصل معنا للاستفسار" : "Contact for Inquiries"}
            </button>
          </div>

        </div>

        {/* MIDDLE SECTION: A pristine 4-column layout respecting RTL/LTR directionality natively */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-start">
          
          {/* Column 1: Clinic Essence & Philosophy */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono tracking-widest text-[#9c7049] uppercase font-bold border-s-2 border-[#9c7049] ps-2.5">
              {isRtl ? "فلسفة البوتيك" : "Boutique Philosophy"}
            </h4>
            <p className="text-xs text-[#f0e8dd]/70 leading-relaxed">
              {isRtl 
                ? "لا نؤمن بالقوالب الموحدة في تصميم الابتسامات. نحن ندرس نسب ملامح الوجه، ولون البشرة، وحتى تعبيرات العين لتصميم توقيع فريد خاص بك وتحت إشراف استشاريي النخبة وبأحدث المجاهر الطبية المتطورة."
                : "We reject cookie-cutter smile grids. We study facial golden ratios, skin tones, and eyes to sculpt a bespoke masterpiece, performed by elite consultants under absolute microscopic precision."}
            </p>
            <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-[#9c7049]">
              <span>{isRtl ? "الفن والدقة بانسجام مطلق" : "Artistry meets surgical precision"}</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono tracking-widest text-[#9c7049] uppercase font-bold border-s-2 border-[#9c7049] ps-2.5">
              {isRtl ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-xs text-[#f0e8dd]/80">
              <li>
                <button 
                  onClick={() => handleScrollTo('home')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navHome}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScrollTo('about')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navAbout}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScrollTo('services')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navServices}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScrollTo('team')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navTeam}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Exploration Pages */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono tracking-widest text-[#9c7049] uppercase font-bold border-s-2 border-[#9c7049] ps-2.5">
              {isRtl ? "اكتشف المزيد" : "Explore More"}
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-xs text-[#f0e8dd]/80">
              <li>
                <button 
                  onClick={() => handleScrollTo('gallery')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navGallery}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScrollTo('testimonials')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navTestimonials}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleScrollTo('blog')} 
                  className="hover:text-[#9c7049] transition-colors py-0.5 cursor-pointer hover:underline text-start block w-full"
                >
                   {t.navBlog}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Exquisite Clinical Address / Contacts */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono tracking-widest text-[#9c7049] uppercase font-bold border-s-2 border-[#9c7049] ps-2.5">
              {isRtl ? "الموقع ومعلومات الاستقبال" : "Location & Reception"}
            </h4>
            <div className="space-y-3.5 text-xs text-[#f0e8dd]/80">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#9c7049] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{t.bookingAddressValue}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#9c7049] shrink-0" />
                <a href={`tel:+${t.bookingPhoneValue.replace(/[^0-9]/g, '')}`} className="hover:text-[#9c7049] transition-colors">
                  <span dir="ltr" className="inline-block">+{t.bookingPhoneValue.replace(/[^0-9]/g, '')}</span>
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#9c7049] shrink-0" />
                <a href={`mailto:${t.bookingEmailValue}`} className="hover:text-[#9c7049] transition-colors">
                  {t.bookingEmailValue}
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock size={15} className="text-[#9c7049] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{t.bookingHoursValue}</span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: separator line with copyright & modern items */}
        <div className="border-t border-[#9c7049]/15 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-mono text-[#f0e8dd]/45">
          
          {/* Copyright text */}
          <div className="text-center md:text-start order-2 md:order-1">
            {t.rightsReserved}
          </div>

          {/* Social icons on center bottom */}
          <div className="flex items-center gap-3 order-1 md:order-2">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full bg-[#f0e8dd]/5 hover:bg-[#9c7049]/20 border border-[#9c7049]/25 flex items-center justify-center transition-all hover:scale-105 duration-300"
              title="Instagram"
            >
              <Instagram size={14} className="text-[#f0e8dd]" />
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noreferrer" 
              className="w-8 h-8 rounded-full bg-[#f0e8dd]/5 hover:bg-[#9c7049]/20 border border-[#9c7049]/25 flex items-center justify-center transition-all hover:scale-105 duration-300"
              title="Facebook"
            >
              <Facebook size={14} className="text-[#f0e8dd]" />
            </a>
            
            {/* Elegant separation block */}
            <span className="text-[#9c7049]/30 mx-1">|</span>

            {/* Quick Scroll to Top inside the bar */}
            <button
              onClick={handleScrollToTop}
              className="flex items-center gap-1.5 border border-[#9c7049]/25 hover:border-[#9c7049]/60 px-3 py-1.5 rounded-full text-[9px] text-[#d2b58b] cursor-pointer transition-colors hover:bg-[#f0e8dd]/5"
            >
              <span>{isRtl ? "العودة للأعلى" : "Scroll Up"}</span>
              <ArrowUp size={12} className="text-[#9c7049]" />
            </button>
          </div>

          {/* Portal gate and credit */}
          <div className="flex items-center gap-2 justify-center md:justify-end order-3">
            <a href="https://www.masarsy.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#d2b58b] transition-colors inline-flex items-center gap-1.5">{t.designedWithLove} <img src={Masarlogo} alt="Massar" className="h-3 w-auto inline-block brightness-0 invert opacity-70" /></a>
            {onOpenAdmin && (
              <button 
                onClick={onOpenAdmin} 
                className="hover:text-[#f0e8dd] underline cursor-pointer hover:no-underline transition-all font-mono uppercase tracking-wider text-[9px] text-[#9c7049] ml-2"
              >
                [ {isRtl ? 'بوابة الإدارة' : 'Admin Portal'} ]
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
