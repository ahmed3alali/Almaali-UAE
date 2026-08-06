/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, ArrowRight, Star, Shield, Heart, Phone } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { motion } from 'motion/react';

interface HeroProps {
  lang: Language;
}

export default function Hero({ lang }: HeroProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const handleBookClick = () => {
    const element = document.getElementById('footer');
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
  };

  return (
    <section
      id="home"
      className="relative min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#f0e8dd] pt-6 pb-12 md:py-20 overflow-hidden"
    >
      {/* Dynamic Ambient Glow Layers */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-[#d2b58b]/15 blur-3xl -mr-40 -mt-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] rounded-full bg-[#9c7049]/10 blur-3xl -ml-40 -mb-40 pointer-events-none" />

      {/* Signature Curve element mimicking a perfect smile arch */}
      <div className="absolute left-0 right-0 bottom-0 w-full h-[150px] pointer-events-none hidden md:block">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#f0e8dd]"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120H1440V24.5C1440 24.5 1100 110 720 110C340 110 0 24.5 0 24.5V120Z"
            fill="currentColor"
          />
          {/* Accent smile line */}
          <path
            d="M0 24.5C0 24.5 340 110 720 110C1100 110 1440 24.5 1440 24.5"
            stroke="#9c7049"
            strokeWidth="0.75"
            strokeOpacity="0.4"
            fill="none"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left column: Text content */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-right" style={{ textAlign: isRtl ? 'right' : 'left' }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-[#d2b58b]/15 border border-[#9c7049]/20 py-1.5 px-4 rounded-full text-xs font-mono text-[#4e4033] tracking-wide"
          >
            <Star size={14} className="text-[#9c7049]" />
            <span>{t.tagline}</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl xl:text-6xl font-display font-bold text-[#4e4033] leading-[1.2] lg:leading-[1.15] tracking-tight"
          >
            {lang === 'ar' ? (
              <>
                ابتسامتك هي <span className="italic text-[#9c7049] font-normal">توقيعك</span> الفريد <span className="text-[#9c7049]">.</span>
              </>
            ) : (
              <>
                Your Smile is Your <span className="italic text-[#9c7049] font-normal">Unique</span> Signature <span className="text-[#9c7049]">.</span>
              </>
            )}
          </motion.h1>

          {/* Subtitle description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg text-[#4e4033]/80 font-sans max-w-2xl leading-relaxed mx-auto lg:mx-0"
          >
            {t.heroSubtitle}
          </motion.p>

          {/* Action Call for Appointment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <button
              id="hero-cta-btn"
              onClick={handleBookClick}
              className="w-full sm:w-auto bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] font-sans font-medium text-sm py-4 px-8 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer border border-[#9c7049]/30 group"
            >
              <span>{t.heroCTA}</span>
              {isRtl ? (
                <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              )}
            </button>

            <a
              href="tel:+966114889000"
              className="text-sm font-sans font-medium text-[#4e4033] hover:text-[#9c7049] transition-colors py-2 flex items-center gap-2 group cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-[#d2b58b]/20 flex items-center justify-center group-hover:bg-[#9c7049]/20 transition-all">
                <Phone size={14} className="text-[#9c7049]" />
              </span>
              <span dir="ltr">+966 11 488 9000</span>
            </a>
          </motion.div>

          {/* Dynamic Interactive Stats with Luxurious Icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="pt-6 grid grid-cols-3 gap-4 border-t border-[#9c7049]/10"
          >
            <div className="text-center lg:text-right" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <div className="flex items-center gap-1 text-[#9c7049] mb-1 justify-center lg:justify-start">
                <Shield size={14} />
                <span className="text-xs font-mono font-medium uppercase tracking-wider">{t.heroPrecise}</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#4e4033]">3D & Micro</div>
              <div className="text-[10px] text-[#4e4033]/60 font-sans">توجيه ميكرومتري رقمي</div>
            </div>

            <div className="text-center lg:text-right" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <div className="flex items-center gap-1 text-[#9c7049] mb-1 justify-center lg:justify-start">
                <Heart size={14} />
                <span className="text-xs font-mono font-medium uppercase tracking-wider">{t.heroRelax}</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#4e4033]">100% Spa</div>
              <div className="text-[10px] text-[#4e4033]/60 font-sans">خالي تمامًا من القلق</div>
            </div>

            <div className="text-center lg:text-right" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              <div className="flex items-center gap-1 text-[#9c7049] mb-1 justify-center lg:justify-start">
                <Star size={14} />
                <span className="text-xs font-mono font-medium uppercase tracking-wider">{t.heroExperience}</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-[#4e4033]">Elite Care</div>
              <div className="text-[10px] text-[#4e4033]/60 font-sans">باقات وخدمات حصرية</div>
            </div>
          </motion.div>

        </div>

        {/* Right column: Artistically Framed High-Quality Lobby Image */}
        <div className="lg:col-span-5 relative flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full max-w-[450px] aspect-[4/5] rounded-t-[160px] rounded-b-[40px] overflow-hidden border-8 border-[#d2b58b]/30 shadow-xl"
          >
            {/* Soft decorative golden frame borders around the image */}
            <div className="absolute inset-2 border border-[#9c7049]/30 rounded-t-[150px] rounded-b-[34px] pointer-events-none z-10" />

            {/* Main lobby photo */}
            <img
              src="/images/luxury_clinic_lobby_1782557901585.jpg"
              alt={`${t.brandName} Luxury Lobby`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Subtle floating overlay accent */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#4e4033]/40 via-transparent to-transparent pointer-events-none" />

            {/* Tiny Luxury Tag Floating in Corner */}
            <div className="absolute bottom-6 left-6 right-6 bg-[#f0e8dd]/90 backdrop-blur-md border border-[#9c7049]/20 p-4 rounded-xl shadow-md z-10 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-[#9c7049]/20 flex items-center justify-center text-[#9c7049] shrink-0">
                <Star size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#4e4033] font-sans">باقة النخبة التجميلية</p>
                <p className="text-[10px] text-[#4e4033]/65 font-mono">Elite Smile Designing Suite</p>
              </div>
            </div>
          </motion.div>

          {/* Decorative architectural circle backdrop */}
          <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[110%] aspect-square rounded-full border border-[#9c7049]/10 pointer-events-none" />
        </div>

      </div>
    </section>
  );
}
