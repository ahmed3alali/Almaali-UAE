/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Language, BlogPost, GalleryItem, Doctor } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Team from './components/Team';
import Gallery from './components/Gallery';
import Testimonials from './components/Testimonials';
import Blog from './components/Blog';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import { BLOG_POSTS, GALLERY, DOCTORS } from './data';
import {
  isSupabaseConfigured,
  fetchBlogPostsFromSupabase,
  fetchGalleryItemsFromSupabase,
  fetchDoctorsFromSupabase,
} from './lib/supabase';
import { cachedFetch, clearSessionCache } from './lib/sessionCache';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [activeSection, setActiveSection] = useState('home');

  // isLoadingData = true only when there's NO cache and we're waiting for Supabase.
  // When cache is available the page renders instantly and this stays false.
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Initialize with static defaults – overridden by cache or Supabase instantly
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY);
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Bump cache version to invalidate old format — increment this when data structure changes
    if (!sessionStorage.getItem('almaali_cache_v3')) {
      clearSessionCache();
      sessionStorage.removeItem('almaali_cache_v2');
      sessionStorage.setItem('almaali_cache_v3', '1');
    }

    let cancelled = false;

    async function loadData() {
      // Run all three fetches with SWR cache in parallel
      const [cachedBlogs, cachedGallery, cachedDoctors] = await Promise.all([
        // Each call returns cached data instantly if available
        cachedFetch<BlogPost>(
          'blogs',
          fetchBlogPostsFromSupabase,
          (fresh) => { if (!cancelled) setBlogPosts(fresh); },
        ),
        cachedFetch<GalleryItem>(
          'gallery',
          fetchGalleryItemsFromSupabase,
          (fresh) => { if (!cancelled) setGalleryItems(fresh); },
        ),
        cachedFetch<Doctor>(
          'doctors',
          fetchDoctorsFromSupabase,
          (fresh) => { if (!cancelled) setDoctors(fresh); },
        ),
      ]);

      if (cancelled) return;

      // Apply whatever was returned (could be cache or fresh network data)
      if (cachedBlogs   && cachedBlogs.length > 0)   setBlogPosts(cachedBlogs);
      if (cachedGallery && cachedGallery.length > 0)  setGalleryItems(cachedGallery);
      if (cachedDoctors && cachedDoctors.length > 0)  setDoctors(cachedDoctors);

      setIsLoadingData(false);
    }

    // Only show loading bar if nothing is cached yet
    const hasCache = Boolean(sessionStorage.getItem('almaali_session_blogs'));
    if (!hasCache) setIsLoadingData(true);

    loadData().catch(err => {
      console.warn('Data load failed:', err);
      if (!cancelled) setIsLoadingData(false);
    });

    return () => { cancelled = true; };
  }, []);

  const [currentView, setCurrentView] = useState<'main' | 'blog' | 'blog-post' | 'admin'>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin') return 'admin';
    if (hash === '#blog') return 'blog';
    if (hash.startsWith('#blog-')) return 'blog-post';
    return 'main';
  });

  const [activePostId, setActivePostId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#blog-') && hash !== '#blog') return hash.substring(6);
    return null;
  });

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    if (path === '/admin') {
      setCurrentView('admin');
      setActivePostId(null);
    } else {
      setCurrentView('main');
      setActivePostId(null);
    }
  };

  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin') {
        setCurrentView('admin');
        setActivePostId(null);
      } else if (hash === '#blog') {
        setCurrentView('blog');
        setActivePostId(null);
        window.scrollTo({ top: 0 });
      } else if (hash.startsWith('#blog-')) {
        setCurrentView('blog-post');
        setActivePostId(hash.substring(6));
        window.scrollTo({ top: 0 });
      } else {
        setCurrentView('main');
        setActivePostId(null);
      }
    };
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
    };
  }, []);

  useEffect(() => {
    if (currentView !== 'main') return;
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'team', 'gallery', 'testimonials', 'blog', 'footer'];
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  // After admin saves: clear cache so next visit gets fresh data
  const refreshFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    clearSessionCache();
    try {
      const [liveBlogs, liveGallery, liveDoctors] = await Promise.all([
        fetchBlogPostsFromSupabase(),
        fetchGalleryItemsFromSupabase(),
        fetchDoctorsFromSupabase(),
      ]);
      if (liveBlogs   && liveBlogs.length > 0)   { setBlogPosts(liveBlogs);   sessionStorage.setItem('almaali_session_blogs', JSON.stringify(liveBlogs)); }
      if (liveGallery && liveGallery.length > 0)  { setGalleryItems(liveGallery); sessionStorage.setItem('almaali_session_gallery', JSON.stringify(liveGallery)); }
      if (liveDoctors && liveDoctors.length > 0)  { console.log('[Refresh] doctors from Supabase:', liveDoctors.length, liveDoctors.map(d => d.name)); setDoctors(liveDoctors);   sessionStorage.setItem('almaali_session_doctors', JSON.stringify(liveDoctors)); }
    } catch (err) {
      console.warn('Could not refresh from Supabase:', err);
    }
  };

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        lang={lang}
        onClose={() => navigateTo('/')}
        blogPosts={blogPosts}
        setBlogPosts={setBlogPosts}
        galleryItems={galleryItems}
        setGalleryItems={setGalleryItems}
        doctors={doctors}
        setDoctors={setDoctors}
        onDataSaved={refreshFromSupabase}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f0e8dd] font-sans overflow-x-hidden selection:bg-[#9c7049]/30 selection:text-[#4e4033] pt-[116px] md:pt-[132px]">

      <Header
        lang={lang}
        setLang={setLang}
        activeSection={currentView === 'blog' || currentView === 'blog-post' ? 'blog' : activeSection}
        currentView={currentView}
      />

      {currentView === 'main' ? (
        <main>
          <Hero lang={lang} />
          <About lang={lang} />
          <Services lang={lang} />
          <Team lang={lang} doctors={doctors} isLoading={isLoadingData} />
          <Gallery lang={lang} galleryItems={galleryItems} isLoading={isLoadingData} />
          <Testimonials lang={lang} />
          <Blog lang={lang} blogPosts={blogPosts} currentView="main" />
        </main>
      ) : (
        <main>
          <Blog
            lang={lang}
            blogPosts={blogPosts}
            currentView={currentView}
            activePostId={activePostId}
          />
        </main>
      )}

      <Footer lang={lang} onOpenAdmin={() => navigateTo('/admin')} />

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50 group flex items-center">
        <div className="absolute right-full mr-3 bg-white text-[#4e4033] text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-[#9c7049]/15 whitespace-nowrap opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
          {lang === 'ar' ? 'تواصل معنا عبر واتساب' : 'Contact us on WhatsApp'}
        </div>
        <span className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none scale-105" />
        <a
          href="https://wa.me/966114889000"
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20ba5a] transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
          aria-label="WhatsApp"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
