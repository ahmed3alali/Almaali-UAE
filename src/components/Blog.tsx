/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type ReactElement } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { BlogPost, Language } from '../types';
import { TRANSLATIONS } from '../data';
import { fetchBlogPostContent, isSupabaseConfigured } from '../lib/supabase';
import SectionReveal from './ui/SectionReveal';
import SafeImage from './ui/SafeImage';
import ContentStatus from './ui/ContentStatus';
import { WHATSAPP } from '../lib/images';
import { scrollToTop } from '../lib/scroll';
import { localeBlogPath, localeHome } from '../lib/routing';
import { localeText } from '../lib/i18n';

interface BlogProps {
  lang: Language;
  blogPosts?: BlogPost[];
  isLoading?: boolean;
  currentView?: 'main' | 'blog' | 'blog-post' | 'admin';
  activePostId?: string | null;
}

function PostCard({
  post,
  lang,
  onOpen,
}: {
  post: BlogPost;
  lang: Language;
  onOpen: () => void;
}): ReactElement {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const hasImage = Boolean(post.image?.trim());

  return (
    <article
      onClick={onOpen}
      className="group flex h-full cursor-pointer flex-col border border-ink/10 bg-bg-light transition duration-400 hover:border-ink/25"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-bg-warm">
        {hasImage ? (
          <SafeImage
            src={post.image}
            alt={localeText(post.title, lang)}
            fallback=""
            className="h-full w-full transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.03] img-grade"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-warm to-bg-light">
            <BookOpen className="text-bronze/35" size={36} strokeWidth={1.25} />
          </div>
        )}
      </div>
      <div className="flex grow flex-col p-6 md:p-7">
        <p className="text-[11px] font-medium tracking-wide text-bronze">
          {localeText(post.category, lang)} · {localeText(post.readTime, lang)}
        </p>
        <h3 className="mt-3 font-display text-2xl text-ink transition group-hover:text-bronze">
          {localeText(post.title, lang)}
        </h3>
        <p className="mt-3 line-clamp-3 grow text-sm leading-relaxed text-muted">
          {localeText(post.excerpt, lang)}
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-ink/8 pt-4 text-[12px] text-ink-soft">
          <span>{localeText(post.author, lang)}</span>
          <span className="inline-flex items-center gap-1.5 text-bronze">
            {t.blogReadMore}
            {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function Blog({
  lang,
  blogPosts = [],
  isLoading = true,
  currentView = 'main',
  activePostId = null,
}: BlogProps) {
  const t = TRANSLATIONS[lang];
  const isRtl = lang === 'ar';
  const displayBlog = blogPosts;
  const [readingProgress, setReadingProgress] = useState(0);
  const [loadedContent, setLoadedContent] = useState<{ ar: string; en: string } | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Always jump to top when entering blog list or a post
  useEffect(() => {
    if (currentView === 'blog' || currentView === 'blog-post') {
      scrollToTop();
      // second tick covers late layout / Lenis init
      const id = window.setTimeout(() => scrollToTop(), 50);
      return () => window.clearTimeout(id);
    }
  }, [currentView, activePostId]);

  useEffect(() => {
    if (currentView !== 'blog-post' || !activePostId) {
      setLoadedContent(null);
      return;
    }
    const post = displayBlog.find((p) => p.id === activePostId);
    if (post?.content?.ar || post?.content?.en) {
      setLoadedContent(post.content);
      return;
    }
    if (!isSupabaseConfigured) return;
    setIsLoadingContent(true);
    fetchBlogPostContent(activePostId)
      .then((content) => {
        if (content) setLoadedContent(content);
      })
      .finally(() => setIsLoadingContent(false));
  }, [currentView, activePostId, displayBlog]);

  useEffect(() => {
    if (currentView !== 'blog-post') {
      setReadingProgress(0);
      return;
    }
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) setReadingProgress((window.scrollY / totalHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView, activePostId]);

  const handleNavigateToPost = (postId: string) => {
    scrollToTop();
    window.history.pushState(null, '', localeBlogPath(lang, postId));
    window.dispatchEvent(new PopStateEvent('popstate'));
    requestAnimationFrame(() => scrollToTop());
  };

  const handleNavigateToGrid = () => {
    scrollToTop();
    window.history.pushState(null, '', localeBlogPath(lang));
    window.dispatchEvent(new PopStateEvent('popstate'));
    requestAnimationFrame(() => scrollToTop());
  };

  const handleNavigateToHome = () => {
    window.history.pushState(null, '', localeHome(lang));
    window.dispatchEvent(new PopStateEvent('popstate'));
    scrollToTop();
  };

  if (currentView === 'main') {
    const previewPosts = displayBlog.slice(0, 3);
    return (
      <section id="blog" className="section-pad bg-bg-warm/30">
        <div className="container-premium">
          <SectionReveal className="max-w-2xl">
            <p className="text-[12px] font-medium tracking-wide text-bronze">{t.blogSectionTitle}</p>
            <h2 className="mt-3 font-display text-display-sm text-ink text-balance">
              {t.blogSectionSubtitle}
            </h2>
          </SectionReveal>

          {isLoading ? (
            <ContentStatus
              lang={lang}
              status="loading"
              className="mt-14 border border-ink/10 bg-bg-light"
            />
          ) : previewPosts.length === 0 ? (
            <ContentStatus
              lang={lang}
              status="empty"
              className="mt-14 border border-ink/10 bg-bg-light"
            />
          ) : (
            <>
              <div className="mt-14 grid gap-5 md:grid-cols-3">
                {previewPosts.map((post, idx) => (
                  <SectionReveal key={post.id} delay={idx * 0.06}>
                    <PostCard post={post} lang={lang} onOpen={() => handleNavigateToPost(post.id)} />
                  </SectionReveal>
                ))}
              </div>
              <div className="mt-12">
                <button
                  type="button"
                  onClick={handleNavigateToGrid}
                  className="inline-flex items-center gap-2 border border-ink/20 px-5 py-3 text-[12px] font-medium tracking-wide text-ink transition hover:border-ink hover:bg-ink hover:text-bg-light"
                >
                  {isRtl ? 'عرض كافة المقالات' : 'View all articles'}
                  {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  if (currentView === 'blog') {
    return (
      <div className="min-h-screen bg-bg-light pb-24 pt-8">
        <div className="container-premium">
          <button
            type="button"
            onClick={handleNavigateToHome}
            className="mb-10 inline-flex items-center gap-2 text-[12px] font-medium tracking-wide text-muted transition hover:text-ink"
          >
            {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            {t.navHome}
          </button>
          <SectionReveal>
            <p className="text-[12px] font-medium tracking-wide text-bronze">{t.blogSectionTitle}</p>
            <h1 className="mt-3 font-display text-display-sm text-ink">
              {isRtl ? 'مدونة عيادات المعالي' : 'Al Maali Clinical Journal'}
            </h1>
            <p className="mt-4 max-w-2xl text-muted">{t.blogSectionSubtitle}</p>
          </SectionReveal>
          {isLoading ? (
            <ContentStatus
              lang={lang}
              status="loading"
              className="mt-12 border border-ink/10 bg-bg-light"
            />
          ) : displayBlog.length === 0 ? (
            <ContentStatus
              lang={lang}
              status="empty"
              className="mt-12 border border-ink/10 bg-bg-light"
            />
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {displayBlog.map((post, idx) => (
                <SectionReveal key={post.id} delay={idx * 0.04}>
                  <PostCard post={post} lang={lang} onOpen={() => handleNavigateToPost(post.id)} />
                </SectionReveal>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'blog-post') {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-bg-light pb-24 pt-8">
          <div className="container-premium">
            <ContentStatus
              lang={lang}
              status="loading"
              className="mt-12 border border-ink/10 bg-bg-light"
            />
          </div>
        </div>
      );
    }

    const activePost = displayBlog.find((p) => p.id === activePostId);
    if (!activePost) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg-light p-6 text-center">
          <BookOpen className="text-bronze" />
          <p className="mt-4 font-display text-2xl text-ink">
            {isRtl ? 'عذراً، المقال غير موجود' : 'Article not found'}
          </p>
          <button
            type="button"
            onClick={handleNavigateToGrid}
            className="mt-4 text-[13px] text-bronze underline"
          >
            {t.blogBack}
          </button>
        </div>
      );
    }

    const content =
      localeText(loadedContent, lang) ||
      localeText(activePost.content, lang) ||
      '';
    const others = displayBlog.filter((p) => p.id !== activePost.id).slice(0, 2);

    return (
      <div className="relative min-h-screen bg-bg-light pb-24">
        {/* Reading progress */}
        <div className="fixed inset-x-0 top-0 z-[55] h-[2px] bg-transparent">
          <div
            className="h-full bg-bronze transition-[width] duration-75"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Article hero */}
        <header className="border-b border-ink/8 bg-bg-warm/40">
          <div className="container-premium pt-6 pb-12 md:pt-8 md:pb-16">
            <button
              type="button"
              onClick={handleNavigateToGrid}
              className="mb-10 inline-flex items-center gap-2 text-[12px] font-medium tracking-wide text-muted transition hover:text-ink"
            >
              {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              {t.blogBack}
            </button>

            <div className="mx-auto max-w-3xl">
              <p className="text-[12px] font-medium tracking-wide text-bronze">
                {localeText(activePost.category, lang)}
              </p>
              <h1 className="mt-4 font-display text-display-sm text-ink text-balance">
                {localeText(activePost.title, lang)}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
                <span>{localeText(activePost.author, lang)}</span>
                <span>{localeText(activePost.date, lang)}</span>
                <span>{localeText(activePost.readTime, lang)}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="container-premium">
          <div className="mx-auto mt-10 max-w-3xl overflow-hidden md:mt-14">
            {activePost.image?.trim() ? (
              <SafeImage
                src={activePost.image}
                alt={localeText(activePost.title, lang)}
                fallback=""
                className="aspect-[16/9] w-full img-grade"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-bg-warm">
                <BookOpen className="text-bronze/35" size={40} strokeWidth={1.25} />
              </div>
            )}
          </div>

          <article className="mx-auto mt-10 max-w-2xl md:mt-14">
            <p className="border-s-2 border-bronze ps-5 text-lg leading-relaxed text-ink-soft md:text-xl">
              {localeText(activePost.excerpt, lang)}
            </p>

            <div className="mt-10 space-y-6 text-base leading-[1.9] text-ink-soft md:text-lg">
              {isLoadingContent ? (
                <div className="flex items-center gap-2 text-muted">
                  <Loader2 className="animate-spin" size={18} />
                  {isRtl ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : (
                content
                  .split('\n')
                  .filter(Boolean)
                  .map((para, i) => <p key={i}>{para}</p>)
              )}
            </div>

            <div className="mt-14 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-medium tracking-wide text-bronze">
                  {isRtl ? 'مناقشة مع فريقنا' : 'Speak with our team'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {isRtl ? 'استشارة خاصة عبر واتساب' : 'Private consultation on WhatsApp'}
                </p>
              </div>
              <a
                href={WHATSAPP.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-ink/20 px-5 py-3 text-[12px] font-medium tracking-wide text-ink transition hover:border-ink hover:bg-ink hover:text-bg-light"
              >
                {t.navContact}
              </a>
            </div>
          </article>

          {others.length > 0 && (
            <div className="mx-auto mt-20 max-w-5xl border-t border-ink/10 pt-14">
              <h2 className="font-display text-2xl text-ink md:text-3xl">
                {isRtl ? 'مقالات ذات صلة' : 'Related articles'}
              </h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {others.map((post) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      lang={lang}
                      onOpen={() => handleNavigateToPost(post.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
