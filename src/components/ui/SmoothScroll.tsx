import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { prefersReducedMotion } from '../../lib/utils';

/** Lenis fights native touch scrolling on phones — keep native scroll on coarse/touch. */
function shouldUseLenis(): boolean {
  if (typeof window === 'undefined') return false;
  if (prefersReducedMotion()) return false;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const noHoverTouch = window.matchMedia('(hover: none)').matches;
  // Phones/tablets: native scroll. Desktop mice: Lenis.
  return finePointer && !noHoverTouch;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!shouldUseLenis()) {
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1,
      wheelMultiplier: 0.95,
      syncTouch: false,
    });

    (window as Window & { __lenis?: Lenis }).__lenis = lenis;
    document.documentElement.classList.add('lenis', 'lenis-smooth');

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete (window as Window & { __lenis?: Lenis }).__lenis;
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
    };
  }, []);

  return <>{children}</>;
}
