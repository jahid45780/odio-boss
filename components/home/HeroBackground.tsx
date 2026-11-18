'use client';

import { motion, type MotionValue } from 'motion/react';
import { SafeImage } from '@/components/ui/safe-image';

interface HeroBackgroundProps {
  backgroundImageUrl?: string;
  spotlightX: MotionValue<number>;
  spotlightY: MotionValue<number>;
  pointerActive: boolean;
  reducedMotion: boolean;
}

const PARTICLES = [
  { top: '16%', left: '12%', size: 'h-1.5 w-1.5', delay: '0s', desktopOnly: false },
  { top: '28%', left: '38%', size: 'h-1 w-1', delay: '1.4s', desktopOnly: false },
  { top: '72%', left: '18%', size: 'h-1.5 w-1.5', delay: '2.2s', desktopOnly: false },
  { top: '22%', left: '78%', size: 'h-1.5 w-1.5', delay: '0.8s', desktopOnly: false },
  { top: '64%', left: '84%', size: 'h-1 w-1', delay: '3.1s', desktopOnly: true },
  { top: '42%', left: '54%', size: 'h-1 w-1', delay: '1.9s', desktopOnly: true },
  { top: '82%', left: '62%', size: 'h-1.5 w-1.5', delay: '2.7s', desktopOnly: true },
  { top: '14%', left: '58%', size: 'h-1 w-1', delay: '4.0s', desktopOnly: true },
];

const WAVEFORM_BARS = [
  { height: 22, delay: '0s' },
  { height: 40, delay: '0.25s' },
  { height: 64, delay: '0.5s' },
  { height: 48, delay: '0.75s' },
  { height: 82, delay: '0.15s' },
  { height: 56, delay: '0.4s' },
  { height: 92, delay: '0.65s' },
  { height: 70, delay: '0.9s' },
  { height: 44, delay: '0.3s' },
  { height: 76, delay: '0.55s' },
  { height: 52, delay: '0.8s' },
  { height: 34, delay: '0.2s' },
  { height: 60, delay: '0.45s' },
  { height: 36, delay: '0.7s' },
  { height: 24, delay: '0.95s' },
];

export function HeroBackground({
  backgroundImageUrl,
  spotlightX,
  spotlightY,
  pointerActive,
  reducedMotion,
}: HeroBackgroundProps) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Optional CMS background image overlay */}
      {backgroundImageUrl && (
        <div className="absolute inset-0 opacity-15 dark:opacity-20">
          <SafeImage src={backgroundImageUrl} alt="" fill className="object-cover" />
        </div>
      )}

      {/* Adaptive Dark/Light deep atmospheric gradient canvas */}
      <div
        className="absolute inset-0 transition-colors duration-300"
        style={{
          background:
            'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 52%, var(--bg-primary) 100%)',
        }}
      />

      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        {/* Animated radial electric blue & cyan lighting orbs */}
        <div
          className={`absolute -top-24 right-[-6%] h-[420px] w-[420px] sm:h-[580px] sm:w-[580px] rounded-full blur-[90px] sm:blur-[120px] opacity-30 dark:opacity-45 ${
            reducedMotion ? '' : 'hero-orb-a'
          }`}
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 58%, transparent) 0%, transparent 72%)',
          }}
        />

        <div
          className={`hidden sm:block absolute -bottom-28 left-[-8%] h-[460px] w-[460px] rounded-full blur-[110px] opacity-20 dark:opacity-32 ${
            reducedMotion ? '' : 'hero-orb-b'
          }`}
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent-secondary) 55%, transparent) 0%, transparent 72%)',
          }}
        />

        {/* Desktop interactive mouse-follow ambient glow */}
        {pointerActive && !reducedMotion && (
          <motion.div
            style={{ x: spotlightX, y: spotlightY }}
            className="hidden lg:block absolute -top-48 -left-48 h-96 w-96 rounded-full blur-[100px] opacity-20 dark:opacity-30"
          >
            <div
              className="h-full w-full rounded-full"
              style={{
                background:
                  'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 65%, transparent) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        )}

        {/* Subtle architectural acoustic grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--text-secondary) 1px, transparent 1px), linear-gradient(to bottom, var(--text-secondary) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 100%)',
          }}
        />

        {/* Subtle perspective acoustic floor plane for spatial depth */}
        <div
          className="hidden md:block absolute inset-x-0 bottom-0 h-44 opacity-[0.09] dark:opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--accent-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--accent-primary) 1px, transparent 1px)',
            backgroundSize: '64px 36px',
            transform: 'perspective(680px) rotateX(68deg) scale(1.3)',
            transformOrigin: 'bottom center',
            maskImage: 'linear-gradient(to top, black 10%, transparent 92%)',
            WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 92%)',
          }}
        />
      </motion.div>

      {/* Subtle floating acoustic particles (reduced on mobile) */}
      {!reducedMotion &&
        PARTICLES.map((p, idx) => (
          <span
            key={idx}
            style={{ top: p.top, left: p.left, animationDelay: p.delay }}
            className={`hero-particle absolute rounded-full bg-accent-primary/45 dark:bg-accent-primary/60 ${p.size} ${
              p.desktopOnly ? 'hidden md:block' : ''
            }`}
          />
        ))}

      {/* Subtle bottom audio frequency waveform */}
      <div className="hidden sm:flex absolute bottom-0 inset-x-0 h-20 items-end justify-center gap-2 sm:gap-3 px-6 opacity-35 dark:opacity-40">
        {WAVEFORM_BARS.map((bar, idx) => (
          <span
            key={idx}
            style={{
              height: `${bar.height}%`,
              animationDelay: bar.delay,
            }}
            className={`${
              reducedMotion ? '' : 'hero-eq-bar'
            } w-1 rounded-full bg-gradient-to-t from-accent-secondary/20 via-accent-primary/50 to-accent-primary/80`}
          />
        ))}
      </div>
    </div>
  );
}
