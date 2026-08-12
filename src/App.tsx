/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { Language, BlogPost, GalleryItem, Doctor } from './types';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Team from './components/Team';
import Gallery from './components/Gallery';
import Testimonials from './components/Testimonials';
import Blog from './components/Blog';
import CTA from './components/CTA';
import Footer from './components/Footer';
import SmoothScroll from './components/ui/SmoothScroll';
import { BLOG_POSTS, GALLERY, DOCTORS } from './data';
import {
  isSupabaseConfigured,
  fetchBlogPostsFromSupabase,
  fetchGalleryItemsFromSupabase,
  fetchDoctorsFromSupabase,
} from './lib/supabase';
import { cachedFetch, clearSessionCache } from './lib/sessionCache';
import { WHATSAPP } from './lib/images';
import { isAdminPath, resolveViewFromLocation, type AppView } from './lib/routing';
import { scrollToTop } from './lib/scroll';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [activeSection, setActiveSection] = useState('home');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(BLOG_POSTS);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(GALLERY);
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);

  // Always resolve from the real URL — default is main (never auto-admin)
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const { view } = resolveViewFromLocation();
    return view;
  });

  const [activePostId, setActivePostId] = useState<string | null>(() => {
    const { postId } = resolveViewFromLocation();
    return postId;
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    if (!sessionStorage.getItem('almaali_cache_v3')) {
      clearSessionCache();
      sessionStorage.removeItem('almaali_cache_v2');
      sessionStorage.setItem('almaali_cache_v3', '1');
    }

    let cancelled = false;

    async function loadData() {
      const [cachedBlogs, cachedGallery, cachedDoctors] = await Promise.all([
        cachedFetch<BlogPost>('blogs', fetchBlogPostsFromSupabase, (fresh) => {
          if (!cancelled) setBlogPosts(fresh);
        }),
        cachedFetch<GalleryItem>('gallery', fetchGalleryItemsFromSupabase, (fresh) => {
          if (!cancelled) setGalleryItems(fresh);
        }),
        cachedFetch<Doctor>('doctors', fetchDoctorsFromSupabase, (fresh) => {
          if (!cancelled) setDoctors(fresh);
        }),
      ]);

      if (cancelled) return;
      if (cachedBlogs && cachedBlogs.length > 0) setBlogPosts(cachedBlogs);
      if (cachedGallery && cachedGallery.length > 0) setGalleryItems(cachedGallery);
      if (cachedDoctors && cachedDoctors.length > 0) setDoctors(cachedDoctors);
      setIsLoadingData(false);
    }

    const hasCache = Boolean(sessionStorage.getItem('almaali_session_blogs'));
    if (!hasCache) setIsLoadingData(true);

    loadData().catch(() => {
      if (!cancelled) setIsLoadingData(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  /** Leave admin / go home — clears /admin from the URL so refresh won't reopen it. */
  const goHome = () => {
    window.history.replaceState(null, '', '/');
    setCurrentView('main');
    setActivePostId(null);
  };

  const openAdmin = () => {
    window.history.pushState(null, '', '/admin');
    setCurrentView('admin');
    setActivePostId(null);
  };

  // Sync view from browser back/forward + hash changes
  useEffect(() => {
    const syncFromLocation = () => {
      const { view, postId } = resolveViewFromLocation();
      setCurrentView(view);
      setActivePostId(postId);
      if (view === 'blog' || view === 'blog-post') {
        scrollToTop();
        requestAnimationFrame(() => scrollToTop());
      }
    };

    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);

    // Safety: if URL is NOT /admin but state somehow is admin, force main
    if (!isAdminPath() && currentView === 'admin') {
      setCurrentView('main');
    }

    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hidden admin entry: Ctrl/Cmd + Shift + A (no public footer button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (isAdminPath() || currentView === 'admin') {
          goHome();
        } else {
          openAdmin();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'main') return;
    const handleScroll = () => {
      const sections = [
        'home',
        'about',
        'services',
        'team',
        'gallery',
        'testimonials',
        'blog',
        'contact',
        'footer',
      ];
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const refreshFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    clearSessionCache();
    try {
      const [liveBlogs, liveGallery, liveDoctors] = await Promise.all([
        fetchBlogPostsFromSupabase(),
        fetchGalleryItemsFromSupabase(),
        fetchDoctorsFromSupabase(),
      ]);
      if (liveBlogs && liveBlogs.length > 0) {
        setBlogPosts(liveBlogs);
        sessionStorage.setItem('almaali_session_blogs', JSON.stringify(liveBlogs));
      }
      if (liveGallery && liveGallery.length > 0) {
        setGalleryItems(liveGallery);
        sessionStorage.setItem('almaali_session_gallery', JSON.stringify(liveGallery));
      }
      if (liveDoctors && liveDoctors.length > 0) {
        setDoctors(liveDoctors);
        sessionStorage.setItem('almaali_session_doctors', JSON.stringify(liveDoctors));
      }
    } catch {
      /* keep current state */
    }
  };

  // Hard gate: never render admin unless URL is exactly /admin
  if (currentView === 'admin' && isAdminPath()) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-bg-dark text-gold font-arabic-body">
            …
          </div>
        }
      >
        <AdminDashboard
          lang={lang}
          onClose={goHome}
          blogPosts={blogPosts}
          setBlogPosts={setBlogPosts}
          galleryItems={galleryItems}
          setGalleryItems={setGalleryItems}
          doctors={doctors}
          setDoctors={setDoctors}
          onDataSaved={refreshFromSupabase}
        />
      </Suspense>
    );
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen overflow-x-hidden bg-bg-light font-sans selection:bg-bronze/30 selection:text-ink">
        <Header
          lang={lang}
          setLang={setLang}
          activeSection={
            currentView === 'blog' || currentView === 'blog-post' ? 'blog' : activeSection
          }
          currentView={currentView === 'admin' ? 'main' : currentView}
        />

        {currentView === 'main' || currentView === 'admin' ? (
          <main>
            <Hero lang={lang} />
            <About lang={lang} />
            <Services lang={lang} />
            <Team lang={lang} doctors={doctors} isLoading={isLoadingData} />
            <Gallery lang={lang} galleryItems={galleryItems} isLoading={isLoadingData} />
            <Testimonials lang={lang} />
            <Blog lang={lang} blogPosts={blogPosts} currentView="main" />
            <CTA lang={lang} />
          </main>
        ) : (
          <main className="pt-28 md:pt-32">
            <Blog
              lang={lang}
              blogPosts={blogPosts}
              currentView={currentView}
              activePostId={activePostId}
            />
          </main>
        )}

        <Footer lang={lang} />

        <div className="fixed bottom-6 end-6 z-50 group flex items-center">
          <div className="pointer-events-none absolute end-full me-3 translate-x-2 whitespace-nowrap rounded-xl border border-bronze/15 bg-bg-light px-3 py-1.5 text-xs font-semibold text-ink opacity-0 shadow-lg transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 rtl:-translate-x-2 rtl:group-hover:translate-x-0">
            {lang === 'ar' ? 'تواصل معنا عبر واتساب' : 'Contact us on WhatsApp'}
          </div>
          <span className="pointer-events-none absolute inset-0 scale-105 animate-ping rounded-full bg-[#25D366]/30" />
          <a
            href={WHATSAPP.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 hover:bg-[#20ba5a] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
            aria-label="WhatsApp"
          >
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>
    </SmoothScroll>
  );
}
