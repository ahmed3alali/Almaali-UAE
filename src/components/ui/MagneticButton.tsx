import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { cn } from '../../lib/utils';

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'ghost' | 'dark' | 'whatsapp';
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  'aria-label'?: string;
};

export default function MagneticButton({
  children,
  className,
  variant = 'primary',
  href,
  target,
  rel,
  type = 'button',
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18 });
  const springY = useSpring(y, { stiffness: 220, damping: 18 });

  const onMove = (e: MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.22);
    y.set(dy * 0.22);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const styles = cn(
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-bold transition-shadow duration-500',
    variant === 'primary' &&
      'bg-ink text-bg-light shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-float)]',
    variant === 'dark' && 'bg-gold text-bg-dark hover:bg-gold-soft',
    variant === 'ghost' &&
      'border border-ink/20 bg-transparent text-ink hover:border-bronze hover:text-bronze',
    variant === 'whatsapp' &&
      'bg-[#25D366] text-white shadow-[0_16px_40px_rgba(37,211,102,0.28)] hover:bg-[#1ebe57]',
    disabled && 'pointer-events-none opacity-60',
    className
  );

  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap">
        {children}
      </span>
      {variant === 'primary' && (
        <span className="absolute inset-0 translate-y-full bg-bronze transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0" />
      )}
    </>
  );

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={reduced || disabled ? undefined : { scale: 0.97 }}
      whileHover={reduced || disabled ? undefined : { scale: 1.02 }}
      className="inline-flex"
    >
      {href ? (
        <a href={href} target={target} rel={rel} className={styles} aria-label={ariaLabel} onClick={onClick}>
          {inner}
        </a>
      ) : (
        <button type={type} className={styles} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
          {inner}
        </button>
      )}
    </motion.div>
  );
}
