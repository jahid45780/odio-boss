'use client';

import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface HeroScrollIndicatorProps {
  reducedMotion: boolean;
  onScrollDown: () => void;
}

export function HeroScrollIndicator({
  reducedMotion,
  onScrollDown,
}: HeroScrollIndicatorProps) {
  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.72, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex justify-center mt-8 sm:mt-10 lg:mt-14"
    >
      <button
        type="button"
        onClick={onScrollDown}
        aria-label="Scroll down to explore SONIQ collection"
        className="group relative inline-flex flex-col items-center gap-2.5 rounded-theme-control px-4 py-2 text-ink-secondary hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary transition-colors cursor-pointer"
      >
        <span className="text-[11px] font-medium tracking-[0.24em] uppercase whitespace-nowrap">
          Scroll to Explore
        </span>

        {/* Vertical acoustic scroll track with ambient pulse halo & downward glide cue */}
        <span className="relative flex items-center justify-center">
          {/* Subtle outer pulsing glow ring */}
          {!reducedMotion && (
            <motion.span
              aria-hidden="true"
              animate={{
                scale: [0.95, 1.35, 0.95],
                opacity: [0.45, 0, 0.45],
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="pointer-events-none absolute inset-0 rounded-full border border-accent-primary/50"
            />
          )}

          {/* Sleek vertical scroll track */}
          <span className="relative flex h-10 w-6 items-start justify-center rounded-full border border-line-strong bg-surface-card/70 p-1.5 backdrop-blur-sm group-hover:border-accent-primary/70 transition-colors shadow-[0_0_18px_-6px_color-mix(in_srgb,var(--accent-primary)_45%,transparent)]">
            <motion.span
              aria-hidden="true"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: [0, 14, 0],
                      opacity: [0.35, 1, 0.35],
                    }
              }
              transition={
                reducedMotion
                  ? undefined
                  : {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
              className="h-2.5 w-1 rounded-full bg-accent-primary"
            />
          </span>
        </span>

        {/* Cascading chevron arrow */}
        <motion.span
          aria-hidden="true"
          animate={
            reducedMotion
              ? undefined
              : {
                  y: [0, 4, 0],
                  opacity: [0.55, 1, 0.55],
                }
          }
          transition={
            reducedMotion
              ? undefined
              : {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.15,
                }
          }
          className="text-accent-primary"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
    </motion.div>
  );
}
