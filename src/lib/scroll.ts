/** Instant scroll to top — works with Lenis when present. */
export function scrollToTop() {
  const lenis = (window as Window & { __lenis?: { scrollTo: (y: number, opts?: object) => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(0, { immediate: true });
    return;
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
