import { useState } from 'react';
import { motion } from 'motion/react';
import { IMAGES, resolveImage } from '../../lib/images';
import { cn } from '../../lib/utils';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  parallax?: boolean;
}

export default function SafeImage({
  src,
  alt,
  className,
  fallback = IMAGES.placeholders.any,
  loading = 'lazy',
  fetchPriority,
  parallax = false,
}: SafeImageProps) {
  const resolved = resolveImage(src, fallback || '');
  const [current, setCurrent] = useState(resolved);
  const [failedOnce, setFailedOnce] = useState(false);

  if (!current) {
    return (
      <div
        className={cn('bg-bg-warm', className)}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <motion.img
      src={current}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      className={cn('bg-bg-warm object-cover', className)}
      whileHover={parallax ? { scale: 1.06 } : undefined}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onError={() => {
        if (!failedOnce) {
          setFailedOnce(true);
          setCurrent(fallback || '');
        }
      }}
    />
  );
}
