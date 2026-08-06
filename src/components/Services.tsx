/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Star,
  ShieldCheck, 
  Sun, 
  RotateCw, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  Plus,
  Minus,
  Compass,
  Gem
} from 'lucide-react';
import { Language } from '../types';
import { SERVICES, TRANSLATIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface ServicesProps {
  lang: Language;
}

export default function Services({ lang }: ServicesProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  
  // Track selected service ID to show detailed breakdown
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Helper to map icon names to actual Lucide Icon elements
  const getIcon = (name: string, size = 20, className = "text-[#9c7049]") => {
    switch (name) {
      case 'ShieldCheck':
        return <ShieldCheck size={size} className={className} />;
      case 'Sun':
        return <Sun size={size} className={className} />;
      case 'RotateCw':
        return <RotateCw size={size} className={className} />;
      case 'Gem':
        return <Gem size={size} className={className} />;
      default:
        return <Star size={size} className={className} />;
    }
  };

  const activeService = SERVICES.find(s => s.id === selectedServiceId) || null;

  return (
    <section 
      id="services" 
      className="py-20 bg-[#d2b58b]/10 relative overflow-hidden border-t border-[#9c7049]/10"
    >
      {/* Curved signature decoration element */}
      <div className="absolute top-0 right-0 w-full h-[60px] pointer-events-none overflow-hidden opacity-30">
        <svg 
          viewBox="0 0 1440 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-[#f0e8dd]"
        >
          <path d="M0 0H1440V40C1440 40 1080 0 720 0C360 0 0 40 0 40V0Z" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-semibold tracking-widest text-[#9c7049] uppercase block">
            {t.servicesSectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#4e4033]">
            {t.servicesSectionSubtitle}
          </h2>
          <div className="w-16 h-[1px] bg-[#9c7049] mx-auto mt-4" />
        </div>

        {/* Master layout for services */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Grid: Elegant Cards list of Specialties */}
          <div className={`lg:col-span-7 space-y-6 ${selectedServiceId ? 'hidden lg:block' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SERVICES.map((service, idx) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 0.95, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group h-full ${
                      isSelected
                        ? 'bg-[#4e4033] border-[#9c7049] text-[#f0e8dd] shadow-lg shadow-[#4e4033]/15'
                        : 'bg-[#f0e8dd] hover:bg-[#d2b58b]/15 border-[#9c7049]/15 hover:border-[#9c7049]/50 text-[#4e4033]'
                    }`}
                    style={{ textAlign: isRtl ? 'right' : 'left' }}
                  >
                    <div>
                      {/* Icon wrapper */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-6 transition-colors ${
                        isSelected 
                          ? 'bg-[#9c7049]/20 border-[#9c7049]' 
                          : 'bg-[#d2b58b]/15 border-[#9c7049]/20 group-hover:bg-[#9c7049]/20'
                      }`}>
                        {getIcon(service.iconName, 22, isSelected ? 'text-[#d2b58b]' : 'text-[#9c7049]')}
                      </div>

                      {/* Title */}
                      <h3 className={`text-lg sm:text-xl font-display font-bold mb-3 ${
                        isSelected ? 'text-[#f0e8dd]' : 'text-[#4e4033]'
                      }`}>
                        {service.title[lang]}
                      </h3>

                      {/* Short summary description */}
                      <p className={`text-xs sm:text-sm leading-relaxed mb-6 font-sans ${
                        isSelected ? 'text-[#f0e8dd]/85' : 'text-[#4e4033]/75'
                      }`}>
                        {service.description[lang]}
                      </p>
                    </div>

                    {/* interactive link element */}
                    <div className="flex items-center gap-2 pt-2 text-xs font-mono font-medium tracking-wide">
                      <span className={isSelected ? 'text-[#d2b58b]' : 'text-[#9c7049] group-hover:underline'}>
                        {t.servicesCTA}
                      </span>
                      {isSelected ? (
                        <Minus size={14} className="text-[#d2b58b]" />
                      ) : (
                        <Plus size={14} className="text-[#9c7049] group-hover:translate-x-1 transition-transform" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Interactive Detail Drawer for the Selected Specialty */}
          <div className="lg:col-span-5 h-full">
            <AnimatePresence mode="wait">
              {activeService ? (
                <motion.div
                  key={activeService.id}
                  initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRtl ? -20 : 20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-[#4e4033] text-[#f0e8dd] rounded-2xl p-8 border border-[#9c7049] shadow-xl flex flex-col justify-between h-full relative"
                  style={{ textAlign: isRtl ? 'right' : 'left' }}
                >
                  {/* Subtle Smile Accent Background Line */}
                  <div className="absolute right-4 top-4 text-[#9c7049]/10 pointer-events-none">
                    {getIcon(activeService.iconName, 120, 'text-[#9c7049]/10')}
                  </div>

                  <div>
                    {/* Header line with go-back button for mobile view */}
                    <div className="flex items-center justify-between border-b border-[#9c7049]/20 pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        {getIcon(activeService.iconName, 22, 'text-[#d2b58b]')}
                        <span className="text-xs font-mono tracking-widest text-[#d2b58b] uppercase">
                          {activeService.id.replace('-', ' ')}
                        </span>
                      </div>
                      
                      {/* Back button only on smaller screens, always useful though */}
                      <button
                        onClick={() => setSelectedServiceId(null)}
                        className="text-xs font-sans text-[#d2b58b] hover:text-[#f0e8dd] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                        <span>{t.servicesBack}</span>
                      </button>
                    </div>

                    <h3 className="text-2xl font-display font-bold mb-4 text-[#f0e8dd] leading-snug">
                      {activeService.title[lang]}
                    </h3>

                    <p className="text-sm text-[#f0e8dd]/85 font-sans leading-relaxed mb-6">
                      {activeService.description[lang]}
                    </p>

                    {/* Detailed list items */}
                    <div className="space-y-4">
                      {activeService.details[lang].map((detail, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#9c7049] mt-2 shrink-0" />
                          <span className="text-xs sm:text-sm text-[#f0e8dd]/90 font-sans leading-relaxed">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Approximate Duration details in footer of card */}
                  <div className="border-t border-[#9c7049]/20 pt-6 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#d2b58b]">
                      <Clock size={14} className="text-[#9c7049]" />
                      <span>{t.servicesDurationLabel}</span>
                      <span className="text-[#f0e8dd] font-semibold font-sans">{activeService.duration[lang]}</span>
                    </div>

                    {/* Mini direct quick contact */}
                    <button
                      onClick={() => {
                        const footerSection = document.getElementById('footer');
                        if (footerSection) {
                          footerSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="bg-[#9c7049] hover:bg-[#d2b58b] text-[#4e4033] hover:text-[#4e4033] text-xs font-sans font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer"
                    >
                      {t.navContact}
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Showcase default guide overlay before user picks one */
                <div 
                  className="bg-[#4e4033]/95 text-[#f0e8dd] rounded-2xl p-8 border border-[#9c7049]/20 h-full flex flex-col justify-center items-center text-center space-y-6 min-h-[300px]"
                >
                  <div className="w-16 h-16 rounded-full bg-[#d2b58b]/10 border border-[#9c7049]/40 flex items-center justify-center text-[#d2b58b]">
                    <Compass size={28} className="animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-display font-medium text-[#d2b58b]">
                      {isRtl ? "اكتشف رقي المعايير الطبية" : "Discover High Standards of Dentistry"}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#f0e8dd]/70 max-w-sm mx-auto font-sans">
                      {isRtl 
                        ? "اختر أحد تخصصات عيادتنا التجميلية أو العلاجية لرؤية التفاصيل الفنية ومدة كل جلسة ونسب النجاح المتوقعة." 
                        : "Select one of our exquisite treatment options to review detailed artistry specifications, approximate timeline, and curated clinical guidelines."}
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </section>
  );
}
