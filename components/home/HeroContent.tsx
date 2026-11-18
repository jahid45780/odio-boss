'use client';

import { motion } from 'motion/react';
import { HeroActions } from './HeroActions';

interface HeroContentProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  reducedMotion: boolean;
}

export function HeroContent({
  eyebrow,
  title,
  description,
  primaryCtaText,
  primaryCtaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
  reducedMotion,
}: HeroContentProps) {
  const words = title.trim().split(/\s+/);
  // Highlight "Beyond Limits." if present, or the last two words when customized
  const highlightMatch = title.match(/^(.*?)(Beyond Limits\.?)$/i);
  const leadWords = highlightMatch
    ? highlightMatch[1].trim().split(/\s+/).filter(Boolean)
    : words.slice(0, Math.max(1, words.length - 2));
  const highlightWords = highlightMatch
    ? highlightMatch[2].trim().split(/\s+/).filter(Boolean)
    : words.slice(Math.max(1, words.length - 2));

  return (
    <div className="space-y-6 text-center lg:text-left">
      {/* Small label fade-in */}
      <motion.p
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-xs font-semibold tracking-[0.26em] uppercase text-accent-primary"
      >
        {eyebrow}
      </motion.p>

      {/* Word-by-word headline reveal with animated gradient highlight */}
      <h1 className="font-display text-[clamp(2.25rem,4.7vw,4.35rem)] font-bold leading-[1.06] tracking-tight text-ink-primary text-balance mx-auto lg:mx-0 max-w-2xl">
        {leadWords.map((word, idx) => (
          <motion.span
            key={`lead-${idx}-${word}`}
            initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.08 + idx * 0.06,
            }}
            className="inline-block mr-[0.26em]"
          >
            {word}
          </motion.span>
        ))}

        <span className="inline-block">
          {highlightWords.map((word, idx) => (
            <motion.span
              key={`hi-${idx}-${word}`}
              initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.08 + (leadWords.length + idx) * 0.06,
              }}
              className="hero-gradient-text inline-block bg-clip-text text-transparent mr-[0.26em] last:mr-0"
            >
              {word}
            </motion.span>
          ))}
        </span>
      </h1>

      {/* Description fade-up */}
      <motion.p
        initial={reducedMotion ? undefined : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
        className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl mx-auto lg:mx-0"
      >
        {description}
      </motion.p>

      {/* Staggered action buttons */}
      <div className="flex justify-center lg:justify-start">
        <HeroActions
          primaryText={primaryCtaText}
          primaryUrl={primaryCtaUrl}
          secondaryText={secondaryCtaText}
          secondaryUrl={secondaryCtaUrl}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Acoustic engineering reference metrics */}
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.52 }}
        className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-line-subtle max-w-lg mx-auto lg:mx-0"
      >
        <div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-primary tabular-nums">
            18 Hz
          </p>
          <p className="text-xs text-ink-secondary mt-0.5">Low-end extension</p>
        </div>
        <div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-primary tabular-nums">
            1800 W
          </p>
          <p className="text-xs text-ink-secondary mt-0.5">Class-D headroom</p>
        </div>
        <div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-primary tabular-nums">
            30 Days
          </p>
          <p className="text-xs text-ink-secondary mt-0.5">Studio home audition</p>
        </div>
      </motion.div>
    </div>
  );
}
