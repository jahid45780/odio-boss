'use client';

import { useEffect, useRef, useState } from 'react';
import { useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import type { WebsiteSettings } from '@/lib/types';
import { DEFAULT_HOMEPAGE_CONFIG } from '@/lib/cms-defaults';
import { HeroBackground } from './HeroBackground';
import { HeroContent } from './HeroContent';
import { HeroSpeakerVisual } from './HeroSpeakerVisual';
import { HeroScrollIndicator } from './HeroScrollIndicator';

interface HeroSectionProps {
  settings: WebsiteSettings;
}

const LEGACY_SUBTITLE =
  'Discover powerful audio technology designed to transform every moment into an unforgettable experience.';
const REFINED_SUBTITLE =
  'Discover powerful audio technology engineered for immersive sound, exceptional clarity, and unforgettable experiences.';

export function HeroSection({ settings }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);

  // Desktop-only smooth pointer tracking via MotionValues (no React re-renders)
  const rawParallaxX = useMotionValue(0);
  const rawParallaxY = useMotionValue(0);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawSpotlightX = useMotionValue(0);
  const rawSpotlightY = useMotionValue(0);

  const parallaxX = useSpring(rawParallaxX, { stiffness: 120, damping: 24, mass: 0.6 });
  const parallaxY = useSpring(rawParallaxY, { stiffness: 120, damping: 24, mass: 0.6 });
  const rotateX = useSpring(rawRotateX, { stiffness: 110, damping: 24, mass: 0.7 });
  const rotateY = useSpring(rawRotateY, { stiffness: 110, damping: 24, mass: 0.7 });
  const spotlightX = useSpring(rawSpotlightX, { stiffness: 140, damping: 28 });
  const spotlightY = useSpring(rawSpotlightY, { stiffness: 140, damping: 28 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    const sync = () => setIsDesktopPointer(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!isDesktopPointer || prefersReducedMotion || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawParallaxX.set(nx * 18);
    rawParallaxY.set(ny * 14);
    rawRotateY.set(nx * 6);
    rawRotateX.set(-ny * 5);
    rawSpotlightX.set(e.clientX - rect.left);
    rawSpotlightY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    rawParallaxX.set(0);
    rawParallaxY.set(0);
    rawRotateX.set(0);
    rawRotateY.set(0);
  };

  const hp = settings.homepageConfig || DEFAULT_HOMEPAGE_CONFIG;
  const heroTitle = settings.heroTitle || 'Experience Sound Beyond Limits.';
  const heroDescription =
    !settings.heroSubtitle || settings.heroSubtitle === LEGACY_SUBTITLE
      ? REFINED_SUBTITLE
      : settings.heroSubtitle;

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="SONIQ Flagship Loudspeaker Showcase"
      className="relative overflow-hidden border-b border-line-subtle bg-surface-primary"
    >
      <HeroBackground
        backgroundImageUrl={hp.heroBackgroundImageUrl}
        spotlightX={spotlightX}
        spotlightY={spotlightY}
        pointerActive={isDesktopPointer}
        reducedMotion={prefersReducedMotion}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-20 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Text & Actions — primary above-the-fold clarity on mobile/tablet, left column on desktop */}
          <div className="lg:col-span-6 order-1">
            <HeroContent
              eyebrow="NEXT GENERATION AUDIO"
              title={heroTitle}
              description={heroDescription}
              primaryCtaText={hp.heroPrimaryCtaText || 'Explore Collection'}
              primaryCtaUrl={hp.heroPrimaryCtaUrl || '/shop'}
              secondaryCtaText={hp.heroSecondaryCtaText || 'Discover Our Technology'}
              secondaryCtaUrl={hp.heroSecondaryCtaUrl || '#technology'}
              reducedMotion={prefersReducedMotion}
            />
          </div>

          {/* Centerpiece Animated Speaker Stage */}
          <div className="lg:col-span-6 order-2 flex items-center justify-center">
            <HeroSpeakerVisual
              imageUrl={settings.heroImageUrl || '/images/hero-flagship.jpg'}
              alt="SONIQ Flagship Reference Loudspeaker"
              parallaxX={parallaxX}
              parallaxY={parallaxY}
              rotateX={rotateX}
              rotateY={rotateY}
              pointerActive={isDesktopPointer}
              reducedMotion={prefersReducedMotion}
            />
          </div>
        </div>

        <HeroScrollIndicator
          reducedMotion={prefersReducedMotion}
          onScrollDown={() => {
            const nextSection = sectionRef.current?.nextElementSibling;
            if (nextSection instanceof HTMLElement) {
              nextSection.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start',
              });
            }
          }}
        />
      </div>
    </section>
  );
}
