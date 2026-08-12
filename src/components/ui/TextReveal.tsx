import { motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '../../lib/utils';

interface TextRevealProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
}

const container: Variants = {
  hidden: {},
  visible: (delay = 0) => ({
    transition: { staggerChildren: 0.045, delayChildren: delay },
  }),
};

const word: Variants = {
  hidden: { y: '110%', opacity: 0, rotateX: 40, filter: 'blur(6px)' },
  visible: {
    y: '0%',
    opacity: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const hasArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

export default function TextReveal({
  text,
  className,
  as = 'h2',
  delay = 0,
}: TextRevealProps) {
  const reduced = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  // Word-clip reveal breaks Arabic shaping / clips glyphs — keep a simple fade
  const simple = reduced || hasArabic(text);
  const Tag = as;

  if (simple) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        <Tag className={className}>{text}</Tag>
      </motion.div>
    );
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-8%' }}
      custom={delay}
      variants={container}
    >
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom pe-[0.28em]">
          <motion.span className="inline-block origin-bottom will-change-transform" variants={word}>
            {w}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}
