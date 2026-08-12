import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import SafeImage from './SafeImage';
import { cn } from '../../lib/utils';

interface ImageStackProps {
  images: string[];
  className?: string;
  alt?: string;
}

export default function ImageStack({ images, className, alt = '' }: ImageStackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-20, 30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [30, -50]);

  const slots = images.slice(0, 4);
  const transforms = [y1, y2, y3, y1];

  return (
    <div ref={ref} className={cn('relative aspect-[4/5] w-full', className)}>
      {slots.map((src, i) => {
        const positions = [
          'inset-0 z-10',
          'start-[18%] top-[12%] z-20 h-[55%] w-[48%]',
          'end-[6%] bottom-[10%] z-30 h-[42%] w-[40%]',
          'start-[8%] bottom-[18%] z-[15] h-[28%] w-[30%]',
        ];
        return (
          <motion.div
            key={`${src}-${i}`}
            style={reduced || i === 0 ? undefined : { y: transforms[i] }}
            initial={reduced ? false : { opacity: 0, y: 48, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 1, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'absolute overflow-hidden rounded-[1.5rem] border border-white/20 shadow-[var(--shadow-float)]',
              positions[i] || positions[0]
            )}
          >
            <SafeImage
              src={src}
              alt={alt}
              className="h-full w-full"
              parallax
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-dark/25 to-transparent" />
          </motion.div>
        );
      })}
    </div>
  );
}
