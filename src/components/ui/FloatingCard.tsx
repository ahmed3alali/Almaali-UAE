import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { springSoft } from '../../lib/animations';
import { cn } from '../../lib/utils';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  float?: boolean;
}

export default function FloatingCard({
  children,
  className,
  glass = false,
  float = false,
}: FloatingCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border border-ink/8 bg-bg-light/90 p-6 shadow-[var(--shadow-soft)] md:p-8',
        glass && 'bg-bg-light/55 backdrop-blur-xl',
        className
      )}
      whileHover={reduced ? undefined : { y: -6, transition: springSoft }}
      animate={
        float && !reduced
          ? { y: [0, -6, 0] }
          : undefined
      }
      transition={
        float && !reduced
          ? { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
          : springSoft
      }
    >
      {children}
    </motion.div>
  );
}
