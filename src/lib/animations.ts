import type { Transition, Variants } from 'motion/react';

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 22,
  mass: 0.8,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
};

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.98, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: easeOutExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export const clipReveal: Variants = {
  hidden: { clipPath: 'inset(12% 12% 12% 12% round 24px)', scale: 1.08, filter: 'blur(4px)' },
  visible: {
    clipPath: 'inset(0% 0% 0% 0% round 24px)',
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.35, ease: easeOutExpo },
  },
};

export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0.2 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.4, ease: easeOutExpo },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: easeOutExpo },
  },
};

export const slideMask: Variants = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: {
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 1.2, ease: easeOutExpo },
  },
};
