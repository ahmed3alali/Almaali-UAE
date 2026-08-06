/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Star, Maximize2, X, ChevronLeft, ChevronRight, Play, Pause, Image as ImageIcon } from 'lucide-react';
import { Language, GalleryItem } from '../types';
import { GALLERY as STATIC_GALLERY, TRANSLATIONS } from '../data';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryProps {
  lang: Language;
  galleryItems?: GalleryItem[];
  isLoading?: boolean;
}

export default function Gallery({ lang, galleryItems }: GalleryProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const displayGallery = galleryItems || STATIC_GALLERY;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play feature
  useEffect(() => {
    if (isPlaying && displayGallery.length > 1) {
      autoplayRef.current = setInterval(() => {
        handleNext();
      }, 5000);
    } else if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [currentIndex, isPlaying, displayGallery]);

  // Reset index if gallery size changes to avoid out of bounds errors
  useEffect(() => {
    if (currentIndex >= displayGallery.length) {
      setCurrentIndex(0);
    }
  }, [displayGallery, currentIndex]);

  const handleNext = () => {
    if (displayGallery.length === 0) return;
    setDirection('next');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % displayGallery.length);
  };

  const handlePrev = () => {
    if (displayGallery.length === 0) return;
    setDirection('prev');
    setCurrentIndex((prevIndex) => (prevIndex - 1 + displayGallery.length) % displayGallery.length);
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 'next' : 'prev');
    setCurrentIndex(index);
  };

  const currentItem = displayGallery[currentIndex];

  // Animation variants for sliding effect
  const slideVariants = {
    enter: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? (isRtl ? -100 : 100) : (isRtl ? 100 : -100),
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: (dir: 'next' | 'prev') => ({
      x: dir === 'next' ? (isRtl ? 100 : -100) : (isRtl ? -100 : 100),
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  return (
    <section 
      id="gallery" 
      className="py-24 bg-[#d2b58b]/10 relative overflow-hidden border-t border-[#9c7049]/10"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Absolute ambient lights */}
      <div className="absolute top-0 right-10 w-[300px] h-[300px] bg-[#9c7049]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[350px] h-[350px] bg-[#4e4033]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono font-semibold tracking-widest text-[#9c7049] uppercase block">
            {t.gallerySectionTitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#4e4033]">
            {t.gallerySectionSubtitle}
          </h2>
          <div className="w-16 h-[1px] bg-[#9c7049] mx-auto mt-4" />
        </div>

        {/* Elegant Slider Shell */}
        <div className="relative bg-white/40 backdrop-blur-md rounded-3xl p-4 sm:p-6 border border-[#9c7049]/10 shadow-xl overflow-hidden">
          
          {displayGallery.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-[#4e4033]/60 space-y-4 bg-white/50 rounded-2xl border border-dashed border-[#9c7049]/20">
              <ImageIcon size={48} className="text-[#9c7049]/50 animate-pulse" />
              <p className="font-display font-medium text-lg">
                {isRtl ? 'لا توجد صور في المعرض حالياً' : 'No images in the gallery yet'}
              </p>
              <p className="text-xs max-w-sm">
                {isRtl 
                  ? 'يمكنك إضافة صور جديدة للمعرض الفني من خلال لوحة التحكم الفخمة في أسفل الصفحة.' 
                  : 'You can add new exquisite photos to the gallery from the admin dashboard at the footer.'}
              </p>
            </div>
          ) : (
            <>
              {/* Main Visual Display */}
              <div className="relative aspect-[16/9] sm:aspect-[21/10] w-full rounded-2xl overflow-hidden bg-[#4e4033]/5 shadow-sm">
                
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    onClick={() => setLightboxItem(currentItem)}
                  >
                    <img 
                      src={currentItem.image} 
                      alt={currentItem.title[lang]} 
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Visual Glass overlay for category badge */}
                    <span className="absolute top-4 right-4 bg-[#4e4033]/85 backdrop-blur-md text-[#f0e8dd] font-sans text-[10px] font-medium tracking-wide px-3 py-1.5 rounded-full border border-[#9c7049]/20 shadow-sm">
                      {currentItem.category === 'clinic' ? t.galleryFilterClinic : t.galleryFilterCases}
                    </span>

                    {/* Micro Hover indicator */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#4e4033]/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <span className="flex items-center gap-2 text-white text-xs font-sans font-medium bg-[#4e4033]/80 backdrop-blur-sm py-2 px-4 rounded-full border border-white/10 shadow-lg">
                        <Maximize2 size={13} />
                        {lang === 'ar' ? 'عرض ملء الشاشة' : 'View Full Screen'}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Slider Navigation Buttons inside the frame */}
                {displayGallery.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrev();
                      }}
                      className="p-2.5 sm:p-3 rounded-full bg-white/90 hover:bg-white text-[#4e4033] hover:text-[#9c7049] border border-[#9c7049]/10 shadow-lg cursor-pointer transition-all duration-300 pointer-events-auto transform active:scale-95 hover:scale-105"
                      aria-label="Previous Slide"
                    >
                      {isRtl ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                      className="p-2.5 sm:p-3 rounded-full bg-white/90 hover:bg-white text-[#4e4033] hover:text-[#9c7049] border border-[#9c7049]/10 shadow-lg cursor-pointer transition-all duration-300 pointer-events-auto transform active:scale-95 hover:scale-105"
                      aria-label="Next Slide"
                    >
                      {isRtl ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Slider Info Box (Details beneath image) */}
              <div className="mt-6 px-2 text-center md:text-right" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className={`flex items-center gap-1.5 justify-center md:justify-start ${isRtl ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                      <Star size={14} className="text-[#9c7049]" />
                      <span className="text-[11px] font-mono tracking-widest text-[#9c7049] uppercase font-bold">
                        {currentItem.category === 'clinic' ? t.galleryFilterClinic : t.galleryFilterCases}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#4e4033]">
                      {currentItem.title[lang]}
                    </h3>
                    {currentItem.description && (
                      <p className="text-xs sm:text-sm text-[#4e4033]/75 font-sans leading-relaxed max-w-3xl">
                        {currentItem.description[lang]}
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Controls Bar (Dots & Play/Pause) */}
              <div className="mt-6 pt-4 border-t border-[#9c7049]/10 flex flex-row items-center justify-between px-2">
                
                {/* Play/Pause Control */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full hover:bg-[#4e4033]/5 text-[#4e4033]/60 hover:text-[#9c7049] transition-all cursor-pointer"
                  title={isPlaying ? (isRtl ? "إيقاف مؤقت" : "Pause Autoplay") : (isRtl ? "تشغيل تلقائي" : "Start Autoplay")}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                {/* Navigation Dots */}
                <div className="flex gap-2 items-center">
                  {displayGallery.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        index === currentIndex 
                          ? 'w-6 bg-[#9c7049] shadow-sm' 
                          : 'w-2 bg-[#9c7049]/20 hover:bg-[#9c7049]/40'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Slide Index Counter */}
                <span className="text-[11px] font-mono text-[#4e4033]/50">
                  {currentIndex + 1} / {displayGallery.length}
                </span>
              </div>
            </>
          )}

        </div>

      </div>

      {/* Lightbox Modal overlay for expanded inspection */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#4e4033]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setLightboxItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#f0e8dd] rounded-[32px] overflow-hidden border border-[#9c7049]/30 max-w-3xl w-full relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-[#4e4033]/80 hover:bg-[#9c7049] rounded-full text-[#f0e8dd] border border-[#9c7049]/30 cursor-pointer transition-colors"
                aria-label="Close Lightbox"
              >
                <X size={18} />
              </button>

              <div className="aspect-[16/10] w-full bg-[#4e4033]/10">
                <img 
                  src={lightboxItem.image} 
                  alt={lightboxItem.title[lang]} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-8 space-y-3" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#9c7049] uppercase tracking-wider">
                  <Star size={12} />
                  <span>{lightboxItem.category === 'clinic' ? t.galleryFilterClinic : t.galleryFilterCases}</span>
                </span>
                
                <h3 className="text-2xl font-display font-bold text-[#4e4033]">
                  {lightboxItem.title[lang]}
                </h3>
                
                {lightboxItem.description && (
                  <p className="text-sm text-[#4e4033]/85 font-sans leading-relaxed">
                    {lightboxItem.description[lang]}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
