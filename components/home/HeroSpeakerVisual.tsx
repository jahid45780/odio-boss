'use client';

import { motion, type MotionValue } from 'motion/react';
import { SafeImage } from '@/components/ui/safe-image';
import { SoundWaveAnimation } from './SoundWaveAnimation';

interface HeroSpeakerVisualProps {
  imageUrl: string;
  alt: string;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  pointerActive: boolean;
  reducedMotion: boolean;
}

export function HeroSpeakerVisual({
  imageUrl,
  alt,
  parallaxX,
  parallaxY,
  rotateX,
  rotateY,
  pointerActive,
  reducedMotion,
}: HeroSpeakerVisualProps) {
  return (
    <div
      className="relative flex items-center justify-center py-4 sm:py-6 lg:py-0"
      style={{ perspective: 1200 }}
    >
      {/* Expanding sound-wave rings behind speaker */}
      <SoundWaveAnimation reducedMotion={reducedMotion} />

      {/* Concentrated electric blue/cyan studio aura behind speaker */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[260px] w-[260px] sm:h-[360px] sm:w-[360px] lg:h-[430px] lg:w-[430px] rounded-full blur-[65px] opacity-45 dark:opacity-70"
        style={{
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 58%, transparent) 0%, color-mix(in srgb, var(--accent-secondary) 32%, transparent) 48%, transparent 74%)',
        }}
      />

      {/* Desktop interactive 3D parallax wrapper */}
      <motion.div
        style={
          pointerActive && !reducedMotion
            ? { x: parallaxX, y: parallaxY, rotateX, rotateY }
            : undefined
        }
        initial={reducedMotion ? undefined : { opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="relative z-10 flex flex-col items-center w-full max-w-[270px] sm:max-w-[350px] md:max-w-[390px] lg:max-w-[440px] xl:max-w-[470px]"
      >
        {/* Continuous elegant floating + gentle scale + micro-rotation loop */}
        <motion.div
          animate={
            reducedMotion
              ? undefined
              : {
                  y: [0, -10, 0],
                  rotate: [-0.45, 0.45, -0.45],
                  scale: [1, 1.016, 1],
                }
          }
          transition={
            reducedMotion
              ? undefined
              : {
                  duration: 7.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="relative w-full will-change-transform"
        >
          {/*
            Dual-theme acoustic showcase stage:
            - Light theme: sculpted dark studio capsule with semantic border & rich ambient shadow so dark hardware pops cleanly.
            - Dark theme: borderless feathered elliptical vignette so the obsidian speaker floats directly in front of the cyan sound-wave rings.
          */}
          <div className="relative aspect-[4/4.7] w-full overflow-hidden rounded-[2rem] border border-line-strong bg-[#05080F] shadow-[0_28px_70px_-15px_rgba(15,23,42,0.32)] dark:border-transparent dark:bg-transparent dark:shadow-none dark:[mask-image:radial-gradient(ellipse_68%_88%_at_50%_48%,black_58%,transparent_98%)]">
            <SafeImage
              src={imageUrl}
              alt={alt}
              fill
              priority
              sizes="(max-width: 640px) 300px, (max-width: 1024px) 400px, 470px"
              className="object-cover object-center"
            />

            {/* Subtle internal studio rim gradient for dimensional depth in Light theme */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 dark:hidden"
              style={{
                background:
                  'radial-gradient(ellipse 85% 90% at 50% 48%, transparent 55%, rgba(5, 6, 8, 0.72) 100%)',
              }}
            />

            {/* Subtle top glass specular reflection in Light theme */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent dark:hidden"
            />
          </div>
        </motion.div>

        {/* Animated floating ground shadow beneath speaker */}
        <div
          aria-hidden="true"
          className={`mt-4 h-4 w-[68%] rounded-full blur-md ${
            reducedMotion ? 'opacity-45' : 'hero-floor-shadow'
          }`}
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, color-mix(in srgb, var(--accent-primary) 24%, transparent) 55%, transparent 78%)',
          }}
        />
      </motion.div>
    </div>
  );
}
