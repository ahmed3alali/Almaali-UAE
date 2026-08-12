import { cn } from '../../lib/utils';

interface MarqueeProps {
  items: string[];
  className?: string;
  speed?: number;
}

/**
 * Seamless ticker — always LTR track so RTL page dir cannot jump the loop mid-cycle.
 */
export default function Marquee({ items, className, speed = 40 }: MarqueeProps) {
  const sequence = items.map((item, i) => (
    <span key={`${item}-${i}`} className="inline-flex items-center gap-10 px-5 text-[11px] font-medium tracking-[0.2em] text-muted uppercase">
      {item}
      <span className="h-1 w-1 rounded-full bg-bronze/50" aria-hidden />
    </span>
  ));

  return (
    <div
      className={cn('relative overflow-hidden border-y border-ink/10 py-5', className)}
      dir="ltr"
    >
      <div
        className="marquee-track flex w-max"
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="flex shrink-0 items-center">{sequence}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {sequence}
        </div>
      </div>
      <style>{`
        .marquee-track {
          animation-name: almaali-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @keyframes almaali-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
