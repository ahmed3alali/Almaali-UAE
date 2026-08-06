/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Star, Microscope, Compass, HeartHandshake } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data';
import { motion } from 'motion/react';

interface AboutProps {
  lang: Language;
}

export default function About({ lang }: AboutProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';

  const pillars = [
    {
      icon: <Microscope size={24} className="text-[#9c7049]" />,
      title: t.aboutPhilosophy1Title,
      description: t.aboutPhilosophy1Desc,
    },
    {
      icon: <Compass size={24} className="text-[#9c7049]" />,
      title: t.aboutPhilosophy3Title,
      description: t.aboutPhilosophy3Desc,
    },
    {
      icon: <HeartHandshake size={24} className="text-[#9c7049]" />,
      title: t.aboutPhilosophy2Title,
      description: t.aboutPhilosophy2Desc,
    },
  ];

  return (
    <section 
      id="about" 
      className="py-20 bg-[#f0e8dd] relative overflow-hidden border-t border-[#9c7049]/10"
    >
      {/* Background decorations */}
      <div className="absolute right-0 top-1/4 w-80 h-80 rounded-full bg-[#d2b58b]/10 blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-1/4 w-80 h-80 rounded-full bg-[#9c7049]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-semibold tracking-widest text-[#9c7049] uppercase block">
            {t.aboutSectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#4e4033]">
            {t.aboutSectionSubtitle}
          </h2>
          <div className="w-16 h-[1px] bg-[#9c7049] mx-auto mt-4" />
        </div>

        {/* Narrative layout with side-by-side content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20">
          
          {/* Narrative description */}
          <div 
            className="lg:col-span-7 space-y-6 text-[#4e4033] order-2 lg:order-1"
            style={{ textAlign: isRtl ? 'right' : 'left' }}
          >
            <div className="inline-flex items-center gap-2 text-[#9c7049] font-mono text-xs font-semibold uppercase tracking-wider">
              <Star size={14} />
              <span>{t.aboutStoryTitle}</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-display font-medium text-[#4e4033] leading-tight">
              {isRtl ? "مكان صُمم لتجاوز فكرة العيادة التقليدية" : "A Space Crafted Beyond Traditional Clinics"}
            </h3>
            
            <p className={`text-base text-[#4e4033]/85 font-sans leading-relaxed max-w-2xl ${
              isRtl ? 'border-r-2 border-[#9c7049] pr-4' : 'border-l-2 border-[#9c7049] pl-4'
            }`}>
              {t.aboutStoryParagraph1}
            </p>
            
            <p className="text-base text-[#4e4033]/80 font-sans leading-relaxed">
              {t.aboutStoryParagraph2}
            </p>


          </div>

          {/* Artistic visual frame */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
            <div className="relative w-full max-w-[380px] aspect-square rounded-[32px] overflow-hidden border border-[#9c7049]/20 shadow-lg group bg-[#d2b58b]/15 p-4">
              
              {/* Inner container frame */}
              <div className="relative w-full h-full rounded-[24px] overflow-hidden border border-[#9c7049]/20">
                <img 
                  src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80" 
                  alt="Minimal luxury clinic corner detail" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual shade overlay */}
                <div className="absolute inset-0 bg-[#4e4033]/15 mix-blend-multiply" />
                
                {/* Centered signature watermark text */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#f0e8dd]/95 p-3 rounded-xl border border-[#9c7049]/10 text-center">
                  <span className="font-display text-xs font-semibold text-[#4e4033] block">
                    {isRtl ? "التفاصيل التي تجلب الطمأنينة" : "Details That Comfort Your Senses"}
                  </span>
                  <span className="text-[9px] font-mono text-[#9c7049] uppercase tracking-wider block mt-0.5">
                    Micro Sensory Elements
                  </span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-12 h-12 border-t-2 border-r-2 border-[#9c7049] rounded-tr-[24px] pointer-events-none" />
              <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-2 border-l-2 border-[#9c7049] rounded-bl-[24px] pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Pillars / Philosophy Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="bg-[#d2b58b]/10 hover:bg-[#d2b58b]/20 border border-[#9c7049]/15 hover:border-[#9c7049]/40 p-8 rounded-2xl transition-all duration-300 flex flex-col justify-between group"
              style={{ textAlign: isRtl ? 'right' : 'left' }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#d2b58b]/20 border border-[#9c7049]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {pillar.icon}
                </div>
                <h4 className="text-xl font-display font-medium text-[#4e4033] mb-3">
                  {pillar.title}
                </h4>
                <p className="text-sm text-[#4e4033]/80 leading-relaxed font-sans">
                  {pillar.description}
                </p>
              </div>
              <div className="w-6 h-[1px] bg-[#9c7049]/40 mt-8 group-hover:w-16 transition-all duration-300" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
