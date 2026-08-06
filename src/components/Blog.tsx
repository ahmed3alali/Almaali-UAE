/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, User, ArrowRight, ArrowLeft, BookOpen, Star, MapPin, Loader2, Phone } from 'lucide-react';
import { Language, BlogPost } from '../types';
import { TRANSLATIONS, BLOG_POSTS as STATIC_BLOG_POSTS } from '../data';
import { isSupabaseConfigured, fetchBlogPostContent } from '../lib/supabase';

interface BlogProps {
  lang: Language;
  blogPosts?: BlogPost[];
  currentView?: 'main' | 'blog' | 'blog-post' | 'admin';
  activePostId?: string | null;
}

export default function Blog({ lang, blogPosts, currentView = 'main', activePostId = null }: BlogProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const displayBlog = blogPosts || STATIC_BLOG_POSTS;
  
  const [readingProgress, setReadingProgress] = useState(0);
  const [loadedContent, setLoadedContent] = useState<{ ar: string; en: string } | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Lazy-load blog post content when viewing a single post
  useEffect(() => {
    if (currentView !== 'blog-post' || !activePostId) {
      setLoadedContent(null);
      return;
    }
    const post = (blogPosts || STATIC_BLOG_POSTS).find(p => p.id === activePostId);
    // If content already exists (from static data), use it directly
    if (post?.content?.ar || post?.content?.en) {
      setLoadedContent(post.content);
      return;
    }
    // Otherwise fetch from Supabase
    if (!isSupabaseConfigured) return;
    setIsLoadingContent(true);
    fetchBlogPostContent(activePostId).then(content => {
      if (content) setLoadedContent(content);
    }).finally(() => setIsLoadingContent(false));
  }, [currentView, activePostId, blogPosts]);

  // Handle scroll progress indicator in detail view
  useEffect(() => {
    if (currentView !== 'blog-post') return;

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const handleNavigateToPost = (postId: string) => {
    window.location.hash = `#blog-${postId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToGrid = () => {
    window.location.hash = '#blog';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToHome = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- VIEW 1: LANDING PAGE PREVIEW ---
  if (currentView === 'main') {
    const previewPosts = displayBlog.slice(0, 3);

    return (
      <section id="blog" className="py-24 bg-[#fcfaf7] relative overflow-hidden">
        {/* Background aesthetics */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#f0e8dd]/40 blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#d2b58b]/10 blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-[#9c7049] uppercase block">
              {isRtl ? 'المعرفة الطبية والجمالية' : 'Medical & Aesthetic Knowledge'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#4e4033]">
              {t.blogSectionTitle}
            </h2>
            <div className="w-16 h-[1px] bg-[#9c7049]/40 mx-auto" />
            <p className="text-xs sm:text-sm text-[#4e4033]/70 font-sans leading-relaxed">
              {t.blogSectionSubtitle}
            </p>
          </div>

          {/* Blog Grid */}
          {previewPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-[#4e4033]/60 space-y-4 bg-white rounded-2xl border border-[#9c7049]/10 shadow-sm max-w-xl mx-auto">
              <BookOpen size={44} className="text-[#9c7049]/60 animate-pulse" />
              <p className="font-display font-bold text-lg">
                {isRtl ? 'لا توجد مقالات في المدونة حالياً' : 'No articles in the blog yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {previewPosts.map((post, idx) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                    onClick={() => handleNavigateToPost(post.id)}
                    className="group bg-white rounded-2xl border border-[#9c7049]/10 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#9c7049]/30 transition-all duration-500 flex flex-col h-full cursor-pointer"
                  >
                    {/* Image and Category */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#f0e8dd]/30">
                      <img
                        src={post.image}
                        alt={post.title[lang]}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-[#4e4033] text-[10px] font-medium tracking-wide px-3 py-1.5 rounded-full border border-[#9c7049]/15 shadow-sm">
                        {post.category[lang]}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 sm:p-7 flex flex-col flex-grow space-y-4">
                      {/* Meta details */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#4e4033]/60 font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[#9c7049]" />
                          {post.date[lang]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-[#9c7049]" />
                          {post.readTime[lang]}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-display font-bold text-[#4e4033] group-hover:text-[#9c7049] transition-colors leading-snug">
                        {post.title[lang]}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs text-[#4e4033]/70 font-sans leading-relaxed flex-grow line-clamp-3">
                        {post.excerpt[lang]}
                      </p>

                      {/* Card Footer - Author and CTA */}
                      <div className="border-t border-[#9c7049]/10 pt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#f0e8dd] flex items-center justify-center border border-[#9c7049]/10">
                            <User size={12} className="text-[#4e4033]" />
                          </div>
                          <span className="text-[11px] font-medium text-[#4e4033]/85">{post.author[lang]}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Read More Arrow */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c7049] group-hover:underline">
                            {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>

              {/* View All CTA Button */}
              <div className="text-center pt-4">
                <button
                  onClick={handleNavigateToGrid}
                  className="inline-flex items-center gap-2 bg-[#4e4033] hover:bg-[#9c7049] text-[#f0e8dd] px-8 py-3.5 rounded-full text-xs font-semibold tracking-wide shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span>{isRtl ? 'عرض كافة المقالات الطبية' : 'View All Medical Articles'}</span>
                  {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- VIEW 2: STANDALONE BLOG GRID PAGE ---
  if (currentView === 'blog') {
    return (
      <div className="bg-[#fcfaf7] min-h-screen py-12 relative overflow-hidden">
        {/* Background luxury lights */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-[#f0e8dd]/40 blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#d2b58b]/15 blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#4e4033]/60 mb-6 border-b border-[#9c7049]/10 pb-4">
            <button onClick={handleNavigateToHome} className="hover:text-[#9c7049] transition-colors cursor-pointer">
              {isRtl ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <span className="text-[#9c7049] font-medium">{isRtl ? 'المدونة العلمية' : 'Scientific Blog'}</span>
          </div>

          {/* Standalone Header */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-2 text-[#9c7049] text-xs font-mono uppercase tracking-widest font-semibold">
              <BookOpen size={14} />
              <span>{isRtl ? 'بوابة المعرفة الطبية والوقائية' : 'MEDICAL & PREVENTIVE KNOWLEDGE PORTAL'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold text-[#4e4033] tracking-tight">
              {isRtl ? 'مدونة عيادات المعالي' : 'Al Maali Clinical Journal'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4e4033]/70 font-sans max-w-3xl leading-relaxed">
              {isRtl 
                ? 'استكشف أحدث المقالات العلمية الطبية والنصائح الوقائية الموثوقة بصياغة حصرية من نخبة الاستشاريين والأطباء لدينا لحماية ورعاية رونق ابتسامتك الفريدة.' 
                : 'Explore advanced insights, treatment comparisons, and preventive clinical guidance curated exclusively by our elite consultants to sustain your luxurious smile.'}
            </p>
          </div>



          {/* Grid Layout of blogs */}
          {displayBlog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center text-[#4e4033]/60 space-y-4 bg-white rounded-3xl border border-[#9c7049]/15 shadow-sm max-w-xl mx-auto">
              <BookOpen size={48} className="text-[#9c7049]/45 animate-pulse" />
              <h3 className="font-display font-bold text-lg">
                {isRtl ? 'لم نجد أي نتائج متطابقة' : 'No clinical matches found'}
              </h3>
              <p className="text-xs leading-relaxed max-w-xs">
                {isRtl 
                  ? 'يرجى مراجعة صياغة البحث أو اختيار تصنيف آخر من القائمة أعلاه.' 
                  : 'Please revise your keyword search or switch to another category filter above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayBlog.map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  onClick={() => handleNavigateToPost(post.id)}
                  className="group bg-white rounded-3xl border border-[#9c7049]/15 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#9c7049]/35 transition-all duration-500 flex flex-col h-full cursor-pointer"
                >
                  {/* Image wrapper */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#f0e8dd]/30">
                    <img
                      src={post.image}
                      alt={post.title[lang]}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-[#4e4033] text-[10px] font-semibold px-3 py-1.5 rounded-full border border-[#9c7049]/15 shadow-sm">
                      {post.category[lang]}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-8 flex flex-col flex-grow space-y-4">
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#4e4033]/60 font-sans">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#9c7049]" />
                        {post.date[lang]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[#9c7049]" />
                        {post.readTime[lang]}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-display font-bold text-[#4e4033] group-hover:text-[#9c7049] transition-colors leading-snug">
                      {post.title[lang]}
                    </h3>

                    {/* Description excerpt */}
                    <p className="text-xs text-[#4e4033]/70 font-sans leading-relaxed flex-grow line-clamp-3">
                      {post.excerpt[lang]}
                    </p>

                    {/* Footer card */}
                    <div className="border-t border-[#9c7049]/10 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#f0e8dd] flex items-center justify-center border border-[#9c7049]/10">
                          <User size={12} className="text-[#4e4033]" />
                        </div>
                        <span className="text-[11px] font-medium text-[#4e4033]/85">{post.author[lang]}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9c7049] group-hover:underline">
                          {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {/* Bottom Back Button */}
          <div className="mt-16 text-center border-t border-[#9c7049]/15 pt-8">
            <button
              onClick={handleNavigateToHome}
              className="inline-flex items-center gap-2 text-xs font-mono text-[#4e4033] hover:text-[#9c7049] transition-colors cursor-pointer group"
            >
              {isRtl ? <ArrowRight size={14} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowLeft size={14} className="group-hover:translate-x-1 transition-transform" />}
              <span>{isRtl ? 'العودة للصفحة الرئيسية العيادية' : 'Return to Clinic Homepage'}</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // --- VIEW 3: STANDALONE SINGLE ARTICLE DETAILS PAGE ---
  if (currentView === 'blog-post') {
    const activePost = displayBlog.find(p => p.id === activePostId) || displayBlog[0];

    if (!activePost) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] p-4 text-center">
          <BookOpen size={48} className="text-[#9c7049] animate-pulse mb-4" />
          <p className="font-display font-bold text-[#4e4033] text-lg">{isRtl ? 'عذراً، المقال غير موجود' : 'Clinical Article Not Found'}</p>
          <button onClick={handleNavigateToGrid} className="mt-4 text-xs font-mono text-[#9c7049] underline cursor-pointer">
            {isRtl ? 'العودة للمقالات' : 'Back to Articles'}
          </button>
        </div>
      );
    }

    const otherBlogs = displayBlog.filter(p => p.id !== activePost.id).slice(0, 3);

    return (
      <div className="bg-[#fcfaf7] min-h-screen relative overflow-hidden pb-24">
        {/* Floating Scroll Progress Indicator */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-[#f0e8dd] z-50">
          <div 
            className="h-full bg-[#9c7049] transition-all duration-75" 
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Ambient background blur circles */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-[#f0e8dd]/30 blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#d2b58b]/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16">
          
          {/* Breadcrumb Navigation */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#4e4033]/60 mb-8 border-b border-[#9c7049]/10 pb-4">
            <button onClick={handleNavigateToHome} className="hover:text-[#9c7049] transition-colors cursor-pointer">
              {isRtl ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <button onClick={handleNavigateToGrid} className="hover:text-[#9c7049] transition-colors cursor-pointer">
              {isRtl ? 'المدونة' : 'Blog'}
            </button>
            <span>/</span>
            <span className="text-[#9c7049] font-medium line-clamp-1 max-w-[200px] sm:max-w-xs">{activePost.title[lang]}</span>
          </div>

          {/* MAIN COLUMN & SIDEBAR GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* LEFT MAIN ARTICLE COLUMN (8 cols on lg) */}
            <article className="lg:col-span-8 space-y-8 bg-white rounded-3xl border border-[#9c7049]/15 shadow-sm p-6 sm:p-10 md:p-12">
              
              {/* Category, Date & Read Time Badge Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#9c7049]/10 pb-6">
                <span className="bg-[#9c7049]/10 text-[#9c7049] text-xs font-semibold px-4 py-1.5 rounded-full border border-[#9c7049]/20">
                  {activePost.category[lang]}
                </span>
                
                <div className="flex items-center gap-4 text-xs text-[#4e4033]/60 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#9c7049]" />
                    {activePost.date[lang]}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#9c7049]" />
                    {activePost.readTime[lang]}
                  </span>
                </div>
              </div>

              {/* Title display */}
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#4e4033] leading-snug tracking-tight">
                {activePost.title[lang]}
              </h1>

              {/* Author signature */}
              <div className="flex items-center gap-3 bg-[#fcfaf7] border border-[#9c7049]/15 p-4 rounded-2xl max-w-sm">
                <div className="w-10 h-10 rounded-full bg-[#f0e8dd] flex items-center justify-center border border-[#9c7049]/20 text-[#4e4033]">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs text-[#4e4033]/60 font-mono uppercase tracking-wider">{isRtl ? 'بقلم الطبيب الاستشاري' : 'Curated by Consultant'}</p>
                  <p className="text-sm font-display font-bold text-[#4e4033]">{activePost.author[lang]}</p>
                </div>
              </div>

              {/* Main image wrapper */}
              <div className="relative aspect-[21/10] bg-[#f0e8dd]/30 rounded-2xl overflow-hidden shadow-sm border border-[#9c7049]/10">
                <img 
                  src={activePost.image} 
                  alt={activePost.title[lang]} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Exquisite introduction callout box */}
              <div className="border-r-4 border-l-4 border-[#9c7049] bg-[#fcfaf7] p-6 rounded-xl text-sm italic text-[#4e4033]/85 leading-relaxed font-sans">
                {activePost.excerpt[lang]}
              </div>

              {/* Pristine body text content */}
              <div className="text-sm sm:text-base text-[#4e4033]/90 font-sans leading-relaxed whitespace-pre-line space-y-6 pt-2">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-[#9c7049]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm font-mono">{isRtl ? 'جاري تحميل المقال...' : 'Loading article...'}</span>
                  </div>
                ) : (
                  (loadedContent?.[lang] || activePost.content[lang])
                )}
              </div>

              {/* Interactive Share Panel / Article footer */}
              <div className="border-t border-[#9c7049]/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Back button */}
                <button
                  onClick={handleNavigateToGrid}
                  className="text-xs font-bold text-[#9c7049] hover:underline cursor-pointer flex items-center gap-1.5 font-mono uppercase"
                >
                  {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                  <span>{isRtl ? 'العودة للمقالات الطبية' : 'Back to Clinical Journal'}</span>
                </button>

              </div>

            </article>

            {/* RIGHT SIDEBAR (4 cols on lg) */}
            <aside className="lg:col-span-4 space-y-8">
              
              {/* Sidebar Luxury Consultation Box */}
              <div className="bg-[#4e4033] text-[#fcf9f5] border border-[#9c7049]/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-2 text-[#9c7049] text-xs font-mono uppercase tracking-widest font-bold">
                  <Star size={14} className="animate-pulse" />
                  <span>{isRtl ? 'رعاية استثنائية مخصصة' : 'EXQUISITE BESPOKE CARE'}</span>
                </div>
                <h3 className="text-xl font-display font-bold tracking-wide">
                  {isRtl ? 'ابدأ رحلة ابتسامتك المثالية اليوم' : 'Sculpt Your Dream Smile with Precision'}
                </h3>
                <p className="text-xs text-[#f0e8dd]/75 leading-relaxed">
                  {isRtl 
                    ? 'في عيادات المعالي، نجمع بين المعرفة الأكاديمية والتقنية المجهرية ثلاثية الأبعاد لتنسيق ابتسامة متميزة تليق بروعة ملامحك.' 
                    : 'We orchestrate academic expertise and state-of-the-art 3D microscopic techniques to design pristine, custom dental assets matching your Golden Ratio.'}
                </p>
                
                {/* Micro details */}
                <div className="space-y-3.5 pt-2 text-[11px] text-[#f0e8dd]/90 font-sans">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={14} className="text-[#9c7049] shrink-0 mt-0.5" />
                    <span>{t.bookingAddressValue}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={14} className="text-[#9c7049] shrink-0" />
                    <span dir="ltr">{t.bookingPhoneValue}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    window.location.hash = '';
                    setTimeout(() => {
                      const element = document.getElementById('footer');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="w-full bg-[#9c7049] hover:bg-[#b0855c] text-white text-xs font-semibold py-3.5 px-5 rounded-xl transition-all shadow-md cursor-pointer text-center block"
                >
                  {isRtl ? 'احجز موعد استشارة نخبوية' : 'Book Luxury Consultation'}
                </button>
              </div>

              {/* Read Next Posts list */}
              {otherBlogs.length > 0 && (
                <div className="bg-white rounded-3xl border border-[#9c7049]/15 shadow-sm p-6 space-y-5">
                  <h4 className="text-xs font-mono tracking-widest text-[#9c7049] uppercase font-bold border-s-2 border-[#9c7049] ps-2.5">
                    {isRtl ? 'اقرأ أيضاً من المعرفة الطبية' : 'Suggested Journal Reads'}
                  </h4>

                  <div className="space-y-4">
                    {otherBlogs.map((post) => (
                      <div 
                        key={post.id}
                        onClick={() => handleNavigateToPost(post.id)}
                        className="flex items-center gap-3 group cursor-pointer border-b border-[#9c7049]/10 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#f0e8dd]/30 border border-[#9c7049]/10">
                          <img 
                            src={post.image} 
                            alt={post.title[lang]} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-semibold text-[#9c7049] uppercase">
                            {post.category[lang]}
                          </span>
                          <h5 className="text-xs font-display font-bold text-[#4e4033] group-hover:text-[#9c7049] transition-colors line-clamp-2 leading-snug">
                            {post.title[lang]}
                          </h5>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </aside>

          </div>

        </div>
      </div>
    );
  }

  return null;
}
