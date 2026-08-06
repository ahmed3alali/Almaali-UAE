import { useRef } from 'react';
import { motion } from 'motion/react';
import { Award, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, Doctor } from '../types';
import { TRANSLATIONS } from '../data';
import { DOCTORS as STATIC_DOCTORS } from '../data';

interface TeamProps {
  lang: Language;
  doctors?: Doctor[];
  isLoading?: boolean;
}

export default function Team({ lang, doctors }: TeamProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const displayDoctors = doctors || STATIC_DOCTORS;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -360 : 360, behavior: 'smooth' });
  };

  return (
    <section id="team" className="py-24 bg-[#f0e8dd] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <span className="text-xs font-mono font-semibold tracking-[0.2em] text-[#9c7049] uppercase block">
            {t.teamSectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#4e4033] leading-tight">
            {t.teamSectionSubtitle}
          </h2>
          <div className="w-12 h-0.5 bg-[#9c7049] mx-auto mt-4" />
        </div>

        {/* Doctor Cards — manual horizontal scroll */}
        <div className="relative mb-20">
          {/* Desktop arrows */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-10 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-[#9c7049]/10 items-center justify-center text-[#4e4033] hover:text-[#9c7049] transition-all cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-10 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white shadow-lg border border-[#9c7049]/10 items-center justify-center text-[#4e4033] hover:text-[#9c7049] transition-all cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth items-stretch"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayDoctors.map((doctor, idx) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="shrink-0 w-[280px] sm:w-[300px] flex"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group w-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-[300px] sm:h-[340px] overflow-hidden bg-[#f0e8dd]">
                    <img
                      src={doctor.image}
                      alt={doctor.name[lang]}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <span className="inline-block bg-[#9c7049] text-white text-[10px] font-mono tracking-wider px-3 py-1 rounded-full mb-2">
                        {doctor.role[lang]}
                      </span>
                      <h3 className="text-xl font-display font-bold text-white">{doctor.name[lang]}</h3>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-3 flex flex-col flex-grow" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.specialties[lang].slice(0, 3).map((spec, sIdx) => (
                        <span key={sIdx} className="text-[10px] text-[#4e4033] bg-[#f0e8dd] px-2.5 py-1 rounded-full font-sans">{spec}</span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#4e4033]/70 font-sans leading-relaxed line-clamp-2 flex-grow">
                      {doctor.bio[lang]}
                    </p>
                    <p className="text-[10px] text-[#9c7049] font-sans font-medium">
                      {doctor.education[lang].split(',')[0]}
                    </p>
                    <a
                      href={`https://wa.me/966114889000?text=${encodeURIComponent(isRtl ? `مرحباً، أريد حجز موعد مع الدكتور ${doctor.name[lang]}` : `Hello, I would like to book an appointment with Dr. ${doctor.name[lang]}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2.5 rounded-xl bg-[#4e4033] text-white text-xs font-medium hover:bg-[#9c7049] transition-all mt-2 cursor-pointer"
                    >
                      {isRtl ? 'حجز موعد' : 'Book'}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#4e4033] rounded-2xl px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-5"
          style={{ textAlign: isRtl ? 'right' : 'left' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#9c7049]/20 flex items-center justify-center shrink-0">
              <Award size={18} className="text-[#d2b58b]" />
            </div>
            <div>
              <p className="text-xs font-mono tracking-widest text-[#d2b58b] uppercase">{t.teamTrustTitle}</p>
              <p className="text-sm text-[#f0e8dd]/80 font-sans mt-0.5">{t.teamTrustDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="#d2b58b" className="text-[#d2b58b]" />
              ))}
            </div>
            <span className="text-sm font-display font-bold text-[#f0e8dd]">100%</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
