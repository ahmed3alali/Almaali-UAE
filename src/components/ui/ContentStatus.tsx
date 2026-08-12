/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2, Sparkles } from 'lucide-react';
import { Language } from '../../types';
import { cn } from '../../lib/utils';

interface ContentStatusProps {
  lang: Language;
  /** Explicit status — never infer empty while still loading */
  status: 'loading' | 'empty';
  tone?: 'light' | 'dark';
  className?: string;
}

export default function ContentStatus({
  lang,
  status,
  tone = 'light',
  className,
}: ContentStatusProps) {
  const isRtl = lang === 'ar';
  const dark = tone === 'dark';

  if (status === 'loading') {
    return (
      <div
        className={cn(
          'flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-16',
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2
          className={cn('h-8 w-8 animate-spin', dark ? 'text-gold' : 'text-bronze')}
          aria-hidden
        />
        <p
          className={cn(
            'font-arabic-body text-sm tracking-wide',
            dark ? 'text-bg-light/70' : 'text-ink-soft'
          )}
        >
          {isRtl ? 'جاري التحميل…' : 'Loading…'}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      <div
        className={cn(
          'mb-5 flex h-14 w-14 items-center justify-center border',
          dark ? 'border-gold/25 text-gold' : 'border-bronze/30 text-bronze'
        )}
      >
        <Sparkles size={22} strokeWidth={1.5} />
      </div>
      <p
        className={cn(
          'font-display text-2xl md:text-3xl',
          dark ? 'text-bg-light' : 'text-ink'
        )}
      >
        {isRtl ? 'نحدّث موقعنا بعناية' : 'We’re refreshing this space'}
      </p>
      <p
        className={cn(
          'mt-3 max-w-md text-sm leading-relaxed',
          dark ? 'text-bg-light/60' : 'text-muted'
        )}
      >
        {isRtl
          ? 'المحتوى قيد التحديث من لوحة التحكم. يعود هذا القسم قريباً بتجربة أكثر دقة وفخامة.'
          : 'This section is being updated from our dashboard. It will return shortly with a refined experience.'}
      </p>
    </div>
  );
}
