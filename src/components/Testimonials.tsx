/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { TESTIMONIALS, TRANSLATIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface TestimonialsProps {
  lang: Language;
}

export default function Testimonials({ lang }: TestimonialsProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[activeIndex];

  return (
    <section 
      id="testimonials" 
      className="py-20 bg-[#f0e8dd] relative overflow-hidden border-t border-[#9c7049]/10"
    >
      {/* Decorative ambient elements */}
      <div className="absolute right-0 top-1/4 w-72 h-72 rounded-full bg-[#d2b58b]/10 blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-1/4 w-72 h-72 rounded-full bg-[#9c7049]/5 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-semibold tracking-widest text-[#9c7049] uppercase block">
            {t.testimonialsSectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#4e4033]">
            {t.testimonialsSectionSubtitle}
          </h2>
          <div className="w-16 h-[1px] bg-[#9c7049] mx-auto mt-4" />
        </div>

        {/* Carousel slide Container */}
        <div className="relative">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="bg-[#d2b58b]/10 border border-[#9c7049]/15 rounded-[32px] p-8 sm:p-12 relative flex flex-col justify-between"
              style={{ textAlign: isRtl ? 'right' : 'left' }}
            >
              {/* Giant quote background watermark */}
              <div className={`absolute text-[#9c7049]/5 pointer-events-none ${isRtl ? 'left-8 top-8' : 'right-8 top-8'}`}>
                <Quote size={120} />
              </div>

              <div className="space-y-6 relative z-10">
                {/* Stars and Verified indicator */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-1 text-[#9c7049]">
                    {[...Array(current.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="#9c7049" />
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1.5 bg-[#4e4033] text-[#f0e8dd] text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-[#9c7049]/20">
                    <CheckCircle2 size={11} className="text-[#9c7049]" />
                    <span>{t.testimonialsVerified}</span>
                  </span>
                </div>

                {/* Patient Review Text */}
                <blockquote className="text-lg sm:text-xl font-display font-medium text-[#4e4033] leading-relaxed italic">
                  "{current.comment[lang]}"
                </blockquote>

                {/* Bottom line detailing Treatment details & User identity */}
                <div className="border-t border-[#9c7049]/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <cite className="not-italic text-base sm:text-lg font-bold text-[#4e4033] block">
                      {current.name[lang]}
                    </cite>
                    <span className="text-xs font-mono text-[#9c7049] uppercase tracking-wider block mt-0.5">
                      {current.treatment[lang]}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#4e4033]/60">
                    {current.date}
                  </span>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Navigational controls */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full border border-[#9c7049]/25 hover:border-[#9c7049] flex items-center justify-center text-[#4e4033] hover:bg-[#d2b58b]/15 transition-all cursor-pointer"
              aria-label="Previous Testimonial"
            >
              {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            
            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full border border-[#9c7049]/25 hover:border-[#9c7049] flex items-center justify-center text-[#4e4033] hover:bg-[#d2b58b]/15 transition-all cursor-pointer"
              aria-label="Next Testimonial"
            >
              {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
