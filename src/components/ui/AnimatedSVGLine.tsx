import { motion, useReducedMotion } from 'motion/react';
import { drawPath } from '../../lib/animations';

interface AnimatedSVGLineProps {
  d: string;
  className?: string;
  strokeWidth?: number;
}

export default function AnimatedSVGLine({
  d,
  className = 'stroke-bronze',
  strokeWidth = 1.5,
}: AnimatedSVGLineProps) {
  const reduced = useReducedMotion();

  return (
    <motion.path
      d={d}
      fill="none"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-15%' }}
      variants={drawPath}
    />
  );
}
